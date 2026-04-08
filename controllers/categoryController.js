const Category = require('../models/Category');
const Loan = require('../models/Loan');
const { success, error } = require('../utils/responseHandler');

const ACTIVE = { is_deleted: false };
const DELETED = { is_deleted: true };

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create({ user_id: req.user.id, name: req.body.name.trim() });
    return success(res, category, 'Category created successfully', 201);
  } catch (err) {
    if (err.code === 11000) return error(res, 'Category already exists', 400);
    next(err);
  }
};

exports.bulkImportCategories = async (req, res, next) => {
  try {
    const { names } = req.body;
    if (!Array.isArray(names) || names.length === 0)
      return error(res, 'names must be a non-empty array', 400);
    if (names.length > 50) return error(res, 'Maximum 50 categories per import', 400);

    const trimmed = [...new Set(names.map((n) => String(n).trim()).filter(Boolean))];
    if (trimmed.length === 0) return error(res, 'No valid category names provided', 400);

    const docs = trimmed.map((name) => ({ user_id: req.user.id, name }));

    // insertMany with ordered:false — skips duplicates, inserts the rest
    const result = await Category.insertMany(docs, { ordered: false }).catch((err) => {
      if (err.code === 11000 || err.name === 'BulkWriteError') return err.insertedDocs || [];
      throw err;
    });

    const inserted = Array.isArray(result) ? result : result;
    return success(
      res,
      { imported: inserted.length, skipped: trimmed.length - inserted.length },
      `${inserted.length} categories imported`,
      201
    );
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ user_id: req.user.id, ...ACTIVE }).sort({ name: 1 });
    return success(res, categories, 'Categories retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.getTrashCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ user_id: req.user.id, ...DELETED }).sort({
      deleted_at: -1,
    });
    return success(res, categories, 'Trash categories retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user_id: req.user.id,
      ...ACTIVE,
    });
    if (!category) return error(res, 'Category not found', 404);

    category.name = req.body.name.trim();
    await category.save();
    return success(res, category, 'Category updated successfully');
  } catch (err) {
    if (err.code === 11000) return error(res, 'Category already exists', 400);
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user_id: req.user.id,
      ...ACTIVE,
    });
    if (!category) return error(res, 'Category not found', 404);

    const inUse = await Loan.exists({
      'items.category_id': req.params.id,
      user_id: req.user.id,
      ...ACTIVE,
    });
    if (inUse)
      return error(res, 'Category is used in one or more loans and cannot be deleted', 400);

    category.is_deleted = true;
    category.deleted_at = new Date();
    await category.save();
    return success(res, null, 'Category moved to trash');
  } catch (err) {
    next(err);
  }
};

exports.restoreCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user_id: req.user.id,
      ...DELETED,
    });
    if (!category) return error(res, 'Category not found in trash', 404);

    category.is_deleted = false;
    category.deleted_at = null;
    await category.save();
    return success(res, category, 'Category restored successfully');
  } catch (err) {
    next(err);
  }
};
