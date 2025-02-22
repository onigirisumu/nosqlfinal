// routes/orders.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// Создание заказа
router.post("/", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Получение всех заказов с деталями
router.get("/", async (req, res) => {
  const orders = await Order.find().populate("user_id").populate("items.product_id");
  res.json(orders);
});

module.exports = router;
