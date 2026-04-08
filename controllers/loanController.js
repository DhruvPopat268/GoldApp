const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Bank = require('../models/Bank');
const Category = require('../models/Category');
const Settings = require('../models/Settings');
const { generatePDF } = require('../utils/pdfGenerator');
const { success, error } = require('../utils/responseHandler');
const fs = require('fs');
const path = require('path');

const ALLOWED_CARATS = [18, 20, 22, 24];
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const ACCOUNT_REGEX = /^[A-Za-z0-9]{5,20}$/;
const ACTIVE = { is_deleted: false };
const DELETED = { is_deleted: true };

const BASE_URL = () => process.env.BASE_URL || 'http://localhost:5000';

// Convert a stored full URL back to a filesystem path for deletion
const deleteFile = (fileUrl) => {
  if (!fileUrl) return;
  try {
    const pathname = new URL(fileUrl).pathname; // e.g. /cloud/images/uuid.jpg
    const abs =
      process.env.NODE_ENV === 'production'
        ? path.join('/app', pathname)
        : path.join(__dirname, '..', pathname);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    /* ignore */
  }
};

const imgUrl = (filename) => {
  const base = BASE_URL();
  return process.env.NODE_ENV === 'production'
    ? `${base}/cloud/images/${filename}`
    : `${base}/uploads/gold_items/${filename}`;
};

const processItems = async (items, userId, existingItems = []) => {
  const processed = [];
  for (let i = 0; i < items.length; i++) {
    const { category_id, gross_weight, net_weight, carat, rate_per_gram, total_items } = items[i];

    if (!category_id || !gross_weight || !net_weight || !carat || !rate_per_gram)
      throw { status: 400, message: `Item ${i + 1}: all fields are required` };

    if (!mongoose.Types.ObjectId.isValid(category_id))
      throw { status: 400, message: `Item ${i + 1}: invalid category_id` };

    const categoryExists = await Category.findOne({ _id: category_id, user_id: userId, ...ACTIVE });
    if (!categoryExists) throw { status: 404, message: `Item ${i + 1}: category not found` };

    const gw = Number(gross_weight),
      nw = Number(net_weight);
    const rpg = Number(rate_per_gram),
      ct = Number(carat);
    const ti = total_items ? Number(total_items) : 1;

    if (isNaN(gw) || gw <= 0)
      throw { status: 400, message: `Item ${i + 1}: gross_weight must be a positive number` };
    if (isNaN(nw) || nw <= 0)
      throw { status: 400, message: `Item ${i + 1}: net_weight must be a positive number` };
    if (isNaN(rpg) || rpg <= 0)
      throw { status: 400, message: `Item ${i + 1}: rate_per_gram must be a positive number` };
    if (isNaN(ti) || ti < 1)
      throw { status: 400, message: `Item ${i + 1}: total_items must be at least 1` };
    if (nw > gw)
      throw { status: 400, message: `Item ${i + 1}: net_weight cannot exceed gross_weight` };
    if (!ALLOWED_CARATS.includes(ct))
      throw { status: 400, message: `Item ${i + 1}: carat must be 18, 20, 22, or 24` };

    processed.push({
      category_id,
      gross_weight: gw,
      net_weight: nw,
      carat: ct,
      rate_per_gram: rpg,
      total_items: ti,
      market_value: parseFloat((nw * rpg).toFixed(2)),
    });
  }
  return processed;
};

const buildPDFPayload = (loan, bank, settings, baseUrl) => {
  const bankForPDF = { ...bank.toObject(), logo: bank.logo ? `${baseUrl}${bank.logo}` : null };
  const loanForPDF = {
    ...loan.toObject(),
    items: loan
      .toObject()
      .items.map((item) => ({ ...item, category_id: item.category_id?.toString() })),
    // images are already full URLs stored in DB — pass them as-is
    images: loan.images || [],
  };
  const settingsForPDF = settings
    ? {
        company_name: settings.company_name || '',
        logo: settings.logo ? `${baseUrl}${settings.logo}` : null,
      }
    : null;
  return { loanForPDF, bankForPDF, settingsForPDF };
};

exports.createLoan = async (req, res, next) => {
  const uploadedFiles = [];
  try {
    const {
      bank_id,
      full_name,
      dob,
      mobile,
      address,
      account_number,
      nominee_name,
      nominee_dob,
      items: itemsRaw,
    } = req.body;

    if (req.files)
      Object.values(req.files)
        .flat()
        .forEach((f) => uploadedFiles.push(imgUrl(f.filename)));

    const requiredFields = {
      bank_id,
      full_name,
      dob,
      mobile,
      address,
      account_number,
      nominee_name,
      nominee_dob,
    };
    for (const [key, val] of Object.entries(requiredFields))
      if (!val) return error(res, `${key} is required`, 400);

    if (!MOBILE_REGEX.test(mobile))
      return error(res, 'Invalid Indian mobile number (10 digits starting with 6-9)', 400);
    if (!ACCOUNT_REGEX.test(account_number))
      return error(res, 'Invalid account number format (5-20 alphanumeric characters)', 400);

    const dobDate = new Date(dob),
      nomineeDobDate = new Date(nominee_dob),
      today = new Date();
    if (isNaN(dobDate.getTime()) || dobDate >= today)
      return error(res, 'dob must be a valid past date', 400);
    if (isNaN(nomineeDobDate.getTime()) || nomineeDobDate >= today)
      return error(res, 'nominee_dob must be a valid past date', 400);

    if (!itemsRaw) return error(res, 'items is required', 400);
    let items;
    try {
      items = JSON.parse(itemsRaw);
    } catch {
      return error(res, 'items must be a valid JSON string', 400);
    }
    if (!Array.isArray(items) || items.length === 0)
      return error(res, 'At least one gold item is required', 400);

    if (!mongoose.Types.ObjectId.isValid(bank_id)) return error(res, 'Invalid bank_id', 400);
    const bank = await Bank.findOne({ _id: bank_id, user_id: req.user.id, ...ACTIVE });
    if (!bank) return error(res, 'Bank not found', 404);

    // Load user settings — apply default_rate to items missing rate_per_gram
    const settings = await Settings.findOne({ user_id: req.user.id });
    if (settings?.default_rate) {
      items = items.map((item) => ({
        ...item,
        rate_per_gram: item.rate_per_gram || settings.default_rate,
      }));
    }

    const processedItems = await processItems(items, req.user.id);
    const total_market_value = parseFloat(
      processedItems.reduce((s, i) => s + i.market_value, 0).toFixed(2)
    );
    const total_items = processedItems.reduce((s, i) => s + i.total_items, 0);
    const loan_value = parseFloat((total_market_value * 0.75).toFixed(2));

    const allImages =
      req.files && req.files['item_image']
        ? req.files['item_image'].map((f) => imgUrl(f.filename))
        : [];

    const loan = await Loan.create({
      user_id: req.user.id,
      bank_id,
      full_name,
      dob: dobDate,
      mobile,
      address,
      account_number,
      nominee_name,
      nominee_dob: nomineeDobDate,
      items: processedItems,
      total_items,
      total_market_value,
      loan_value,
      images: allImages,
    });

    const categories = await Category.find({ user_id: req.user.id, ...ACTIVE });
    const baseUrl = BASE_URL();
    const { loanForPDF, bankForPDF, settingsForPDF } = buildPDFPayload(
      loan,
      bank,
      settings,
      baseUrl
    );

    const pdfUrl = await generatePDF(loanForPDF, bankForPDF, categories, settingsForPDF);
    loan.pdf_path = pdfUrl;
    await loan.save();

    return success(
      res,
      { ...loan.toObject(), pdf_url: pdfUrl, total_items },
      'Loan created successfully',
      201
    );
  } catch (err) {
    uploadedFiles.forEach(deleteFile);
    next(err);
  }
};

exports.getLoans = async (req, res, next) => {
  try {
    const loans = await Loan.find({ user_id: req.user.id, ...ACTIVE })
      .populate('bank_id', 'name logo')
      .populate('items.category_id', 'name')
      .sort({ createdAt: -1 });
    return success(
      res,
      loans.map((l) => ({ ...l.toObject(), pdf_url: l.pdf_path || null })),
      'Loans retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

exports.getLoansHistory = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = { user_id: req.user.id, ...ACTIVE };

    if (from || to) {
      filter.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (isNaN(fromDate.getTime())) return error(res, 'Invalid from date', 400);
        filter.createdAt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (isNaN(toDate.getTime())) return error(res, 'Invalid to date', 400);
        // Include the full to-day by setting time to end of day
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    const loans = await Loan.find(filter)
      .populate('bank_id', 'name logo')
      .populate('items.category_id', 'name')
      .sort({ createdAt: -1 });

    return success(
      res,
      loans.map((l) => ({ ...l.toObject(), pdf_url: l.pdf_path || null })),
      'Loan history retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

exports.getLoansSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = { user_id: req.user.id, ...ACTIVE };

    if (from || to) {
      filter.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (isNaN(fromDate.getTime())) return error(res, 'Invalid from date', 400);
        filter.createdAt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (isNaN(toDate.getTime())) return error(res, 'Invalid to date', 400);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    const [result] = await Loan.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_loans: { $sum: 1 },
          total_market_value: { $sum: '$total_market_value' },
          total_loan_value: { $sum: '$loan_value' },
        },
      },
    ]);

    return success(
      res,
      {
        total_loans: result?.total_loans || 0,
        total_market_value: parseFloat((result?.total_market_value || 0).toFixed(2)),
        total_loan_value: parseFloat((result?.total_loan_value || 0).toFixed(2)),
      },
      'Loan summary retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

exports.regeneratePDF = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return error(res, 'Loan not found', 404);

    const loan = await Loan.findOne({ _id: req.params.id, user_id: req.user.id, ...ACTIVE });
    if (!loan) return error(res, 'Loan not found', 404);

    const bank = await Bank.findById(loan.bank_id);
    if (!bank) return error(res, 'Bank not found', 404);

    const settings = await Settings.findOne({ user_id: req.user.id });
    const categories = await Category.find({ user_id: req.user.id, ...ACTIVE });
    const baseUrl = BASE_URL();
    const { loanForPDF, bankForPDF, settingsForPDF } = buildPDFPayload(
      loan,
      bank,
      settings,
      baseUrl
    );

    deleteFile(loan.pdf_path);
    const pdfUrl = await generatePDF(loanForPDF, bankForPDF, categories, settingsForPDF);
    loan.pdf_path = pdfUrl;
    await loan.save();

    return success(res, { pdf_url: pdfUrl }, 'PDF regenerated successfully');
  } catch (err) {
    next(err);
  }
};

exports.getTrashLoans = async (req, res, next) => {
  try {
    const loans = await Loan.find({ user_id: req.user.id, ...DELETED })
      .populate('bank_id', 'name logo')
      .populate('items.category_id', 'name')
      .sort({ deleted_at: -1 });
    return success(res, loans, 'Trash loans retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getLoanById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return error(res, 'Loan not found', 404);
    const loan = await Loan.findOne({ _id: req.params.id, user_id: req.user.id, ...ACTIVE })
      .populate('bank_id', 'name logo')
      .populate('items.category_id', 'name');
    if (!loan) return error(res, 'Loan not found', 404);
    return success(
      res,
      { ...loan.toObject(), pdf_url: loan.pdf_path || null },
      'Loan retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

exports.updateLoan = async (req, res, next) => {
  const uploadedFiles = [];
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return error(res, 'Loan not found', 404);
    const loan = await Loan.findOne({ _id: req.params.id, user_id: req.user.id, ...ACTIVE });
    if (!loan) return error(res, 'Loan not found', 404);

    if (req.files)
      Object.values(req.files)
        .flat()
        .forEach((f) => uploadedFiles.push(imgUrl(f.filename)));

    const {
      bank_id,
      full_name,
      dob,
      mobile,
      address,
      account_number,
      nominee_name,
      nominee_dob,
      items: itemsRaw,
    } = req.body;
    const today = new Date();

    if (bank_id) {
      if (!mongoose.Types.ObjectId.isValid(bank_id)) return error(res, 'Invalid bank_id', 400);
      const bank = await Bank.findOne({ _id: bank_id, user_id: req.user.id, ...ACTIVE });
      if (!bank) return error(res, 'Bank not found', 404);
      loan.bank_id = bank_id;
    }

    if (full_name) loan.full_name = full_name;
    if (address) loan.address = address;
    if (nominee_name) loan.nominee_name = nominee_name;

    if (mobile) {
      if (!MOBILE_REGEX.test(mobile))
        return error(res, 'Invalid Indian mobile number (10 digits starting with 6-9)', 400);
      loan.mobile = mobile;
    }
    if (account_number) {
      if (!ACCOUNT_REGEX.test(account_number))
        return error(res, 'Invalid account number format (5-20 alphanumeric characters)', 400);
      loan.account_number = account_number;
    }
    if (dob) {
      const d = new Date(dob);
      if (isNaN(d.getTime()) || d >= today) return error(res, 'dob must be a valid past date', 400);
      loan.dob = d;
    }
    if (nominee_dob) {
      const d = new Date(nominee_dob);
      if (isNaN(d.getTime()) || d >= today)
        return error(res, 'nominee_dob must be a valid past date', 400);
      loan.nominee_dob = d;
    }

    if (itemsRaw) {
      let items;
      try {
        items = JSON.parse(itemsRaw);
      } catch {
        return error(res, 'items must be a valid JSON string', 400);
      }
      if (!Array.isArray(items) || items.length === 0)
        return error(res, 'At least one gold item is required', 400);

      try {
        loan.items = await processItems(items, req.user.id, loan.items);
      } catch (e) {
        return error(res, e.message, e.status || 400);
      }

      loan.total_market_value = parseFloat(
        loan.items.reduce((s, i) => s + i.market_value, 0).toFixed(2)
      );
      loan.total_items = loan.items.reduce((s, i) => s + i.total_items, 0);
      loan.loan_value = parseFloat((loan.total_market_value * 0.75).toFixed(2));
    }

    // Handle new images
    if (req.files && req.files['item_image']) {
      const newImages = req.files['item_image'].map((f) => imgUrl(f.filename));
      loan.images = [...(loan.images || []), ...newImages];
    }

    const bank = await Bank.findById(loan.bank_id);
    const settings = await Settings.findOne({ user_id: req.user.id });
    const categories = await Category.find({ user_id: req.user.id, ...ACTIVE });
    const baseUrl = BASE_URL();
    const { loanForPDF, bankForPDF, settingsForPDF } = buildPDFPayload(
      loan,
      bank,
      settings,
      baseUrl
    );

    deleteFile(loan.pdf_path);
    const pdfUrl = await generatePDF(loanForPDF, bankForPDF, categories, settingsForPDF);
    loan.pdf_path = pdfUrl;
    await loan.save();

    return success(
      res,
      { ...loan.toObject(), pdf_url: pdfUrl, total_items: loan.total_items },
      'Loan updated successfully'
    );
  } catch (err) {
    uploadedFiles.forEach(deleteFile);
    next(err);
  }
};

exports.deleteLoan = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return error(res, 'Loan not found', 404);
    const loan = await Loan.findOne({ _id: req.params.id, user_id: req.user.id, ...ACTIVE });
    if (!loan) return error(res, 'Loan not found', 404);

    loan.is_deleted = true;
    loan.deleted_at = new Date();
    await loan.save();
    return success(res, null, 'Loan moved to trash');
  } catch (err) {
    next(err);
  }
};

exports.restoreLoan = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return error(res, 'Loan not found', 404);
    const loan = await Loan.findOne({ _id: req.params.id, user_id: req.user.id, ...DELETED });
    if (!loan) return error(res, 'Loan not found in trash', 404);

    loan.is_deleted = false;
    loan.deleted_at = null;
    await loan.save();
    return success(res, loan, 'Loan restored successfully');
  } catch (err) {
    next(err);
  }
};

exports.getLoansByDate = async (req, res, next) => {
  try {
    const { date, bankId } = req.body;

    console.log('=== getLoansByDate Debug ===');
    console.log('Received date from frontend:', date);
    console.log('Received bankId:', bankId);

    if (!date) return error(res, 'date is required', 400);

    // Validate dd-mm-yy format
    const parts = date.split('-');
    if (parts.length !== 3) return error(res, 'Invalid date format. Use dd-mm-yy', 400);

    const filter = {
      user_id: req.user.id,
      ...ACTIVE,
    };

    if (bankId) {
      if (!mongoose.Types.ObjectId.isValid(bankId)) return error(res, 'Invalid bankId', 400);
      filter.bank_id = bankId;
    }

    console.log('Filter applied:', JSON.stringify(filter));

    // Get all loans matching user and optional bankId
    const allLoans = await Loan.find(filter)
      .populate('bank_id', 'name logo')
      .populate('items.category_id', 'name')
      .sort({ createdAt: -1 });

    console.log('Total loans fetched:', allLoans.length);

    // Filter by converting createdAt to dd-mm-yy format
    const filteredLoans = allLoans.filter((loan) => {
      const createdAt = new Date(loan.createdAt);
      const day = String(createdAt.getDate()).padStart(2, '0');
      const month = String(createdAt.getMonth() + 1).padStart(2, '0');
      const year = String(createdAt.getFullYear()).slice(-2);
      const formattedDate = `${day}-${month}-${year}`;
      
      console.log(`Loan ID: ${loan._id} | createdAt: ${loan.createdAt} | Formatted: ${formattedDate} | Match: ${formattedDate === date}`);
      
      return formattedDate === date;
    });

    console.log('Filtered loans count:', filteredLoans.length);
    console.log('=== End Debug ===');

    return success(
      res,
      filteredLoans.map((l) => ({ ...l.toObject(), pdf_url: l.pdf_path || null })),
      'Loans retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};
