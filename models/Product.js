// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  ref: String,
  categorie: String,
  title: String,
  price: Number,
  tags: [String],
  description: String,
  image: String
});
const Product = mongoose.model('Product', productSchema);
module.exports = Product;