const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

categorySchema.index({ user_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
