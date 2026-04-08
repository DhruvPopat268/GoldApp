const Bank = require('../models/Bank');
const Loan = require('../models/Loan');
const fs = require('fs');
const path = require('path');
const { success, error } = require('../utils/responseHandler');

const deleteFile = (relPath) => {
  if (!relPath) return;
  const abs = path.join(__dirname, '..', relPath);
  try {
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    /* ignore */
  }
};

const ACTIVE = { is_deleted: false };
const DELETED = { is_deleted: true };

exports.createBank = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'Logo image is required', 400);
    const logo = `/uploads/banks/${req.file.filename}`;
    const bank = await Bank.create({ user_id: req.user.id, name: req.body.name.trim(), logo });
    return success(res, bank, 'Bank created successfully', 201);
  } catch (err) {
    next(err);
  }
};

exports.getBanks = async (req, res, next) => {
  try {
    const banks = await Bank.find({ user_id: req.user.id, ...ACTIVE }).sort({ createdAt: -1 });
    return success(res, banks, 'Banks retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getTrashBanks = async (req, res, next) => {
  try {
    const banks = await Bank.find({ user_id: req.user.id, ...DELETED }).sort({ deleted_at: -1 });
    return success(res, banks, 'Trash banks retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.updateBank = async (req, res, next) => {
  try {
    const bank = await Bank.findOne({ _id: req.params.id, user_id: req.user.id, ...ACTIVE });
    if (!bank) return error(res, 'Bank not found', 404);

    if (req.body.name) bank.name = req.body.name.trim();
    if (req.file) {
      deleteFile(bank.logo);
      bank.logo = `/uploads/banks/${req.file.filename}`;
    }

    await bank.save();
    return success(res, bank, 'Bank updated successfully');
  } catch (err) {
    next(err);
  }
};

exports.deleteBank = async (req, res, next) => {
  try {
    const bank = await Bank.findOne({ _id: req.params.id, user_id: req.user.id, ...ACTIVE });
    if (!bank) return error(res, 'Bank not found', 404);

    const inUse = await Loan.exists({ bank_id: req.params.id, user_id: req.user.id, ...ACTIVE });
    if (inUse) return error(res, 'Bank is used in one or more loans and cannot be deleted', 400);

    bank.is_deleted = true;
    bank.deleted_at = new Date();
    await bank.save();
    return success(res, null, 'Bank moved to trash');
  } catch (err) {
    next(err);
  }
};

exports.restoreBank = async (req, res, next) => {
  try {
    const bank = await Bank.findOne({ _id: req.params.id, user_id: req.user.id, ...DELETED });
    if (!bank) return error(res, 'Bank not found in trash', 404);

    bank.is_deleted = false;
    bank.deleted_at = null;
    await bank.save();
    return success(res, bank, 'Bank restored successfully');
  } catch (err) {
    next(err);
  }
};
