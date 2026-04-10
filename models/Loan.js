const mongoose = require('mongoose');

const goldItemSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },

  gross_weight: { type: Number, required: true, min: [0.01, 'gross_weight must be positive'] },
  net_weight: { type: Number, required: true, min: [0.01, 'net_weight must be positive'] },

  carat: { type: Number, enum: [18, 20, 22, 24], required: true },

  rate_per_gram: { type: Number, required: true, min: [1, 'rate_per_gram must be positive'] },

  total_items: { type: Number, default: 1, min: [1, 'total_items must be at least 1'] },

  item_note: { type: String, trim: true, maxlength: 500 }, // NEW: Optional comment per item

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

    // 🔥 NEW FIELDS (FROM UI)
    gold_purity: { type: String, enum: ['18K', '20K', '22K', '24K'] },
    market_value_per_gram: { type: Number },
    ltv: { type: Number }, // %
    max_permissible_limit: { type: Number }, // USER INPUT - Can be manually entered
    market_value_for_gold: { type: Number }, // USER INPUT - Can be manually entered
    final_amount: { type: Number },
    advanced_value_type: { type: String, default: 'LTV' },

    total_market_value: { type: Number },
    loan_value: { type: Number },

    images: { type: [String] },
    pdf_path: { type: String },

    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);


// ✅ AUTO CALCULATION
loanSchema.pre('save', function () {
  let totalMarketValue = 0;
  let totalItems = 0;

  this.items.forEach((item) => {
    // Calculate market value per item: net_weight * rate_per_gram
    const value = item.net_weight * item.rate_per_gram;
    item.market_value = parseFloat(value.toFixed(2));

    // Sum up total market value and total items
    totalMarketValue += value * item.total_items;
    totalItems += item.total_items;
  });

  this.total_items = totalItems;
  this.total_market_value = parseFloat(totalMarketValue.toFixed(2));
  
  // NEW: market_value_for_gold - Use user input if provided, otherwise use total_market_value
  if (!this.market_value_for_gold) {
    this.market_value_for_gold = this.total_market_value;
  }

  // 🔥 LTV logic (default 75%)
  const ltv = this.ltv || 75;

  // NEW: max_permissible_limit - Use user input if provided, otherwise calculate
  if (!this.max_permissible_limit) {
    this.max_permissible_limit = parseFloat((totalMarketValue * (ltv / 100)).toFixed(2));
  }

  // loan_value calculation (same as max_permissible_limit)
  this.loan_value = this.max_permissible_limit;

  // 🔥 Final amount fallback
  if (!this.final_amount) {
    this.final_amount = this.loan_value;
  }
});

module.exports = mongoose.model('Loan', loanSchema);