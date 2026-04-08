const Bank = require('../models/Bank');
const Loan = require('../models/Loan');
const fs = require('fs');
const path = require('path');

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
    if (!req.file) return res.status(400).json({ error: 'Logo image is required' });
    const logo = `/uploads/banks/${req.file.filename}`;
    const bank = await Bank.create({ user_id: req.user.id, name: req.body.name.trim(), logo });
    return res.status(201).json(bank);
  } catch (err) {
    next(err);
  }
};

exports.getBanks = async (req, res, next) => {
  try {
    const banks = await Bank.find({ user_id: req.user.id, ...ACTIVE }).sort({ createdAt: -1 });
    return res.json(banks);
  } catch (err) {
    next(err);
  }
};

exports.getTrashBanks = async (req, res, next) => {
  try {
    const banks = await Bank.find({ user_id: req.user.id, ...DELETED }).sort({ deleted_at: -1 });
    return res.json(banks);
  } catch (err) {
    next(err);
  }
};

exports.updateBank = async (req, res, next) => {
  try {
    const bank = await Bank.findOne({ _id: req.params.id, user_id: req.user.id, ...ACTIVE });
    if (!bank) return res.status(404).json({ error: 'Bank not found' });

    if (req.body.name) bank.name = req.body.name.trim();
    if (req.file) {
      deleteFile(bank.logo);
      bank.logo = `/uploads/banks/${req.file.filename}`;
    }

    await bank.save();
    return res.json(bank);
  } catch (err) {
    next(err);
  }
};

exports.deleteBank = async (req, res, next) => {
  try {
    const bank = await Bank.findOne({ _id: req.params.id, user_id: req.user.id, ...ACTIVE });
    if (!bank) return res.status(404).json({ error: 'Bank not found' });

    const inUse = await Loan.exists({ bank_id: req.params.id, user_id: req.user.id, ...ACTIVE });
    if (inUse) return res.status(400).json({ error: 'Bank is used in one or more loans and cannot be deleted' });

    bank.is_deleted = true;
    bank.deleted_at = new Date();
    await bank.save();
    return res.json({ message: 'Bank moved to trash' });
  } catch (err) {
    next(err);
  }
};

exports.restoreBank = async (req, res, next) => {
  try {
    const bank = await Bank.findOne({ _id: req.params.id, user_id: req.user.id, ...DELETED });
    if (!bank) return res.status(404).json({ error: 'Bank not found in trash' });

    bank.is_deleted = false;
    bank.deleted_at = null;
    await bank.save();
    return res.json(bank);
  } catch (err) {
    next(err);
  }
};
