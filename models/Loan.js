const mongoose = require('mongoose');

const goldItemSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  gross_weight: { type: Number, required: true, min: [0.01, 'gross_weight must be positive'] },
  net_weight: { type: Number, required: true, min: [0.01, 'net_weight must be positive'] },
  carat: { type: Number, enum: [18, 20, 22, 24], required: true },
  rate_per_gram: { type: Number, required: true, min: [1, 'rate_per_gram must be positive'] },
  total_items: { type: Number, default: 1, min: [1, 'total_items must be at least 1'] },
  market_value: { type: Number },
});

const loanSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bank_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank', required: true },
    full_name: { type: String, required: true, trim: true, maxlength: 150 },
    dob: { type: Date, required: true },
    mobile: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, 'Invalid Indian mobile number'],
    },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    account_number: {
      type: String,
      required: true,
      trim: true,
      match: [/^[A-Za-z0-9]{5,20}$/, 'Invalid account number format'],
    },
    nominee_name: { type: String, required: true, trim: true, maxlength: 150 },
    nominee_dob: { type: Date, required: true },
    items: {
      type: [goldItemSchema],
      validate: [(v) => v.length > 0, 'At least one item required'],
    },
    total_items: { type: Number, default: 0 },
    total_market_value: { type: Number },
    loan_value: { type: Number },
    images: { type: [String] },
    pdf_path: { type: String },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Loan', loanSchema);
