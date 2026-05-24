const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const Product = require('../models/Product');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer - image memory তে রাখবে
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ সব product দেখাও
router.get('/', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

// ✅ নতুন product add করো (ছবি সহ)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    let imageUrl = '';
    let imagePublicId = '';

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'foresstree' },
          (error, result) => error ? reject(error) : resolve(result)
        ).end(req.file.buffer);
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const product = new Product({
      ...req.body,
      image: imageUrl,
      imagePublicId,
    });

    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Product delete করো (ছবিও delete হবে)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }

    await product.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;