const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    logo: { type: String, required: true },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

bankSchema.virtual('logo_url').get(function () {
  return `${process.env.BASE_URL}${this.logo}`;
});

module.exports = mongoose.model('Bank', bankSchema);
