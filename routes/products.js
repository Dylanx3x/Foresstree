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

// Multer — memory তে রাখবে
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max (video এর জন্য)
});

// ✅ Cloudinary তে image upload helper
async function uploadImage(buffer, folder) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => error ? reject(error) : resolve(result)
    ).end(buffer);
  });
}

// ✅ Cloudinary তে video upload helper
async function uploadVideo(buffer, folder) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: 'video' },
      (error, result) => error ? reject(error) : resolve(result)
    ).end(buffer);
  });
}

// ✅ সব product দেখাও
router.get('/', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

// ✅ নতুন product add করো (multiple images + video)
router.post(
  '/',
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // ✅ Multiple images upload
      let imagesData = [];
      if (req.files?.images?.length) {
        for (const file of req.files.images) {
          const result = await uploadImage(file.buffer, 'foresstree/products');
          imagesData.push({ url: result.secure_url, publicId: result.public_id });
        }
      }

      // ✅ Video upload
      let videoUrl = '';
      let videoPublicId = '';
      if (req.files?.video?.[0]) {
        const result = await uploadVideo(req.files.video[0].buffer, 'foresstree/videos');
        videoUrl = result.secure_url;
        videoPublicId = result.public_id;
      }

      const product = new Product({
        ...req.body,
        // পুরনো single image field (backward compat)
        image: imagesData[0]?.url || '',
        imagePublicId: imagesData[0]?.publicId || '',
        // নতুন multiple images
        images: imagesData,
        // video
        video: videoUrl,
        videoPublicId,
      });

      await product.save();
      res.json({ success: true, product });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Product edit/update করো
router.put(
  '/:id',
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      // ✅ নতুন images আসলে পুরনোগুলো delete করে নতুন upload করো
      if (req.files?.images?.length) {
        // পুরনো images Cloudinary থেকে delete
        for (const img of product.images || []) {
          if (img.publicId) await cloudinary.uploader.destroy(img.publicId);
        }
        if (product.imagePublicId) await cloudinary.uploader.destroy(product.imagePublicId);

        // নতুন images upload
        const imagesData = [];
        for (const file of req.files.images) {
          const result = await uploadImage(file.buffer, 'foresstree/products');
          imagesData.push({ url: result.secure_url, publicId: result.public_id });
        }
        product.images = imagesData;
        product.image = imagesData[0]?.url || '';
        product.imagePublicId = imagesData[0]?.publicId || '';
      }

      // ✅ নতুন video আসলে পুরনো delete করে নতুন upload করো
      if (req.files?.video?.[0]) {
        if (product.videoPublicId) {
          await cloudinary.uploader.destroy(product.videoPublicId, { resource_type: 'video' });
        }
        const result = await uploadVideo(req.files.video[0].buffer, 'foresstree/videos');
        product.video = result.secure_url;
        product.videoPublicId = result.public_id;
      }

      // ✅ Text fields update
      const fields = ['name', 'price', 'originalPrice', 'category', 'description', 'icon', 'stock', 'freeShipping', 'isNew', 'isFeatured'];
      fields.forEach(f => {
        if (req.body[f] !== undefined) product[f] = req.body[f];
      });

      await product.save();
      res.json({ success: true, product });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ Product delete করো (ছবি ও video ও delete হবে)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // সব images delete
    for (const img of product.images || []) {
      if (img.publicId) await cloudinary.uploader.destroy(img.publicId);
    }
    if (product.imagePublicId) await cloudinary.uploader.destroy(product.imagePublicId);

    // video delete
    if (product.videoPublicId) {
      await cloudinary.uploader.destroy(product.videoPublicId, { resource_type: 'video' });
    }

    await product.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;