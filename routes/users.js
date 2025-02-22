// routes/users.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Регистрация пользователя
router.post("/register", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Получение всех пользователей
router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

module.exports = router;
