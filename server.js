require('dotenv').config();  // ← এটা সবার আগে

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors({
  origin: '*'
}));
app.use(express.json());

// MongoDB connect
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected ✅'))
  .catch((err) => console.log('MongoDB error:', err));

// Routes
const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);


// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true, token: 'admin-' + process.env.ADMIN_PASSWORD });
  } else {
    res.status(401).json({ success: false, message: 'Wrong password' });
  }
});

// Sitemap
const Product = require('./models/Product');
app.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await Product.find({}, '_id updatedAt');
    
    const urls = products.map(p => `
  <url>
    <loc>https://www.foresstree.com/product/${p._id}</loc>
    <lastmod>${new Date(p.updatedAt).toISOString().split('T')[0]}</lastmod>
  </url>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.foresstree.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
  <url>
    <loc>https://www.foresstree.com/products</loc>
  </url>${urls}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Foresstree Server running! ✅' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});