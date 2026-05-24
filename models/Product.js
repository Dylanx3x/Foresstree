const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  category: { type: String, required: true },
  description: { type: String },
  icon: { type: String, default: '📦' },
  image: { type: String },
  imagePublicId: { type: String },
  stock: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
  rating: { type: Number, default: 4.0 },
  reviews: { type: Number, default: 0 },
  freeShipping: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);