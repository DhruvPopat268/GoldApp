const Category = require('../models/Category');
const Loan = require('../models/Loan');

const ACTIVE = { is_deleted: false };
const DELETED = { is_deleted: true };

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create({ user_id: req.user.id, name: req.body.name.trim() });
    return res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Category already exists' });
    next(err);
  }
};

exports.bulkImportCategories = async (req, res, next) => {
  try {
    const { names } = req.body;
    if (!Array.isArray(names) || names.length === 0)
      return res.status(400).json({ error: 'names must be a non-empty array' });
    if (names.length > 50) return res.status(400).json({ error: 'Maximum 50 categories per import' });

    const trimmed = [...new Set(names.map((n) => String(n).trim()).filter(Boolean))];
    if (trimmed.length === 0) return res.status(400).json({ error: 'No valid category names provided' });

    const docs = trimmed.map((name) => ({ user_id: req.user.id, name }));

    // insertMany with ordered:false — skips duplicates, inserts the rest
    const result = await Category.insertMany(docs, { ordered: false }).catch((err) => {
      if (err.code === 11000 || err.name === 'BulkWriteError') return err.insertedDocs || [];
      throw err;
    });

    const inserted = Array.isArray(result) ? result : result;
    return res.status(201).json({ imported: inserted.length, skipped: trimmed.length - inserted.length });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ user_id: req.user.id, ...ACTIVE }).sort({ name: 1 });
    return res.json(categories);
  } catch (err) {
    next(err);
  }
};

exports.getTrashCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ user_id: req.user.id, ...DELETED }).sort({
      deleted_at: -1,
    });
    return res.json(categories);
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
    if (!category) return res.status(404).json({ error: 'Category not found' });

    category.name = req.body.name.trim();
    await category.save();
    return res.json(category);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Category already exists' });
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
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const inUse = await Loan.exists({
      'items.category_id': req.params.id,
      user_id: req.user.id,
      ...ACTIVE,
    });
    if (inUse)
      return res.status(400).json({ error: 'Category is used in one or more loans and cannot be deleted' });

    category.is_deleted = true;
    category.deleted_at = new Date();
    await category.save();
    return res.json({ message: 'Category moved to trash' });
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
    if (!category) return res.status(404).json({ error: 'Category not found in trash' });

    category.is_deleted = false;
    category.deleted_at = null;
    await category.save();
    return res.json(category);
  } catch (err) {
    next(err);
  }
};
