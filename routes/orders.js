const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// ===================================
//  📧 EMAIL SETUP
// ===================================
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendOrderEmail(order) {
  const itemList = order.items
    .map(i => `  ${i.icon || '📦'} ${i.name} × ${i.quantity} = ৳${Math.round(i.price * i.quantity * 110).toLocaleString()}`)
    .join('\n');

  const totalBDT = Math.round(order.total * 110).toLocaleString();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // নিজের Gmail-এ
    subject: `🛍️ নতুন Order! — ${order.customer.firstName} — ৳${totalBDT}`,
    text: `
🎉 নতুন Order এসেছে!
━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Customer Info:
   নাম: ${order.customer.firstName} ${order.customer.lastName || ''}
   ফোন: ${order.customer.phone}
   ${order.customer.altPhone ? `বিকল্প ফোন: ${order.customer.altPhone}` : ''}
   ${order.customer.email ? `Email: ${order.customer.email}` : ''}

📍 Delivery Address:
   ${order.address.street}
   ${order.address.thana ? order.address.thana + ', ' : ''}${order.address.district || ''}
   ${order.address.division || ''}
   ${order.address.note ? `নোট: ${order.address.note}` : ''}

🛍️ Order Items:
${itemList}

━━━━━━━━━━━━━━━━━━━━━━━━━
💰 সর্বমোট: ৳${totalBDT}
💳 Payment: ${order.paymentMethod}
📋 Status: ${order.status}
━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 Admin Panel: https://foresstree.com/admin.html
    `.trim(),
  };

  await transporter.sendMail(mailOptions);
  console.log('✅ Order email sent successfully');
}

// ===================================
//  📦 ORDER SCHEMA
// ===================================
const orderSchema = new mongoose.Schema({
  customer: {
    firstName: { type: String, required: true },
    lastName: { type: String },
    phone: { type: String, required: true },
    altPhone: { type: String },
    email: { type: String },
  },
  address: {
    street: { type: String, required: true },
    thana: { type: String },
    district: { type: String },
    division: { type: String },
    note: { type: String },
  },
  items: [{
    productId: { type: String },
    name: { type: String, required: true },
    icon: { type: String },
    image: { type: String },
    category: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  }],
  paymentMethod: { type: String, default: 'Cash on Delivery' },
  paymentStatus: { type: String, default: 'Pending', enum: ['Pending', 'Paid', 'Failed'] },
  subtotal: { type: Number },
  shipping: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  couponCode: { type: String },
  status: {
    type: String,
    default: 'Processing',
    enum: ['Processing', 'Confirmed', 'Shipping', 'Delivered', 'Cancelled', 'Returned']
  },
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

    // Email পাঠাও (error হলেও order save থাকবে)
    try {
      await sendOrderEmail(order);
    } catch (emailErr) {
      console.error('⚠️ Email error (order saved):', emailErr.message);
    }

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