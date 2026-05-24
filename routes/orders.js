const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ===================================
//  📦 ORDER MODEL
// ===================================
const orderSchema = new mongoose.Schema({
  // Customer info
  customer: {
    firstName: { type: String, required: true },
    lastName: { type: String },
    phone: { type: String, required: true },
    altPhone: { type: String },
    email: { type: String },
  },
  // Delivery address
  address: {
    street: { type: String, required: true },
    thana: { type: String },
    district: { type: String },
    division: { type: String },
    note: { type: String },
  },
  // Order items
  items: [{
    productId: { type: String },
    name: { type: String, required: true },
    icon: { type: String },
    image: { type: String },
    category: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  }],
  // Payment
  paymentMethod: { type: String, default: 'Cash on Delivery' },
  paymentStatus: { type: String, default: 'Pending', enum: ['Pending', 'Paid', 'Failed'] },
  // Order details
  subtotal: { type: Number },
  shipping: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  couponCode: { type: String },
  // Status
  status: {
    type: String,
    default: 'Processing',
    enum: ['Processing', 'Confirmed', 'Shipping', 'Delivered', 'Cancelled', 'Returned']
  },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);

// ===================================
//  📋 GET ALL ORDERS
// ===================================
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================
//  📋 GET SINGLE ORDER
// ===================================
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================
//  ➕ CREATE NEW ORDER
// ===================================
router.post('/', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================
//  ✏️ UPDATE ORDER STATUS
// ===================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const update = { updatedAt: Date.now() };
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================================
//  🗑️ DELETE ORDER
// ===================================
router.delete('/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;