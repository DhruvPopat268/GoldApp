const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    company_name: { type: String, trim: true, maxlength: 150, default: '' },
    logo: { type: String, default: null },
    default_rate: { type: Number, min: 0, default: 0 },
    default_bank_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
