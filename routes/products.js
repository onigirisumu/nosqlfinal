// routes/products.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Добавление нового товара
router.post("/", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Получение всех товаров
router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

module.exports = router;

