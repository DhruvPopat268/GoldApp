const Settings = require('../models/Settings');
const Bank = require('../models/Bank');
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

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOne({ user_id: req.user.id }).populate(
      'default_bank_id',
      'name logo'
    );
    return success(res, settings || {}, 'Settings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { company_name, default_rate, default_bank_id } = req.body;

    const update = {};

    if (company_name !== undefined) {
      if (String(company_name).trim().length > 150) return error(res, 'company_name too long', 400);
      update.company_name = String(company_name).trim();
    }

    if (default_rate !== undefined) {
      const rate = Number(default_rate);
      if (isNaN(rate) || rate < 0)
        return error(res, 'default_rate must be a non-negative number', 400);
      update.default_rate = rate;
    }

    if (default_bank_id !== undefined) {
      if (default_bank_id === '' || default_bank_id === null) {
        update.default_bank_id = null;
      } else {
        const bank = await Bank.findOne({
          _id: default_bank_id,
          user_id: req.user.id,
          is_deleted: false,
        });
        if (!bank) return error(res, 'Bank not found', 404);
        update.default_bank_id = default_bank_id;
      }
    }

    if (req.file) {
      const existing = await Settings.findOne({ user_id: req.user.id });
      if (existing?.logo) deleteFile(existing.logo);
      update.logo = `/uploads/banks/${req.file.filename}`;
    }

    const settings = await Settings.findOneAndUpdate(
      { user_id: req.user.id },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    ).populate('default_bank_id', 'name logo');

    return success(res, settings, 'Settings updated successfully');
  } catch (err) {
    next(err);
  }
};
