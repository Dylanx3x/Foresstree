const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(cors());
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

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Foresstree Server running! ✅' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});