// models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number
    }
  ],
  status: { type: String, default: 'pending' },
  order_date: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
