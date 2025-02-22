const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Models
const Post = require('./models/Post.js');
const Product = require('./models/Product.js');
const User = require('./models/User.js');
const Order = require('./models/Order.js');

// Middleware for checking admin rights
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).send('Access denied: Admins only');
}

// Middleware for checking authentication
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/signin');
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Serve static files from the "public" directory
app.use(express.static('public'));

// Set up session middleware
app.use(
  session({
    secret: 'mySecretKey', // Use a strong secret in production!
    resave: false,
    saveUninitialized: false
  })
);

// Make session data available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://danel:0000@cluster0.avoaf.mongodb.net/FinalNoSQL", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(err => {
    console.log("Error connecting to MongoDB", err);
  });

/* --------------------- ROUTES --------------------- */

app.post('/get-recommendation', isAuthenticated, async (req, res) => {
  try {
    const { style, skin_tone, zodiac } = req.body;
    const response = await axios.post('http://127.0.0.1:8000/recommend', { style, skin_tone, zodiac });
    const recommendations = response.data.recommendations;
    res.render('recommendation', { recommendations });
  } catch (error) {
    console.error('Error fetching recommendation:', error.response ? error.response.data : error.message);
    res.status(500).send('Error fetching recommendation.');
  }
});

// Search/Filter Products Route
// Search/Filter Products Route
app.get('/products/search', async (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;
  let filter = {};

  // If a product ID is provided, filter by _id.
  if (q) {
    filter._id = q;
  }

  // If a category is selected, filter by the "categorie" field
  if (category) {
    filter.categorie = { $regex: `^${category}$`, $options: 'i' };
  }

  // Price range filtering
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) {
      filter.price.$gte = parseFloat(minPrice);
    }
    if (maxPrice) {
      filter.price.$lte = parseFloat(maxPrice);
    }
  }

  try {
    const products = await Product.find(filter);
    res.render('products', { products });
  } catch (err) {
    console.error('Error during product search:', err);
    res.status(500).send('Error retrieving products.');
  }
});


// Home page route
app.get('/', (req, res) => {
  res.render('home');
});

// Sign-up routes
app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Enforce strong password: at least 9 characters, one number, and one symbol
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{9,})/;
    if (!passwordRegex.test(password)) {
      return res.status(400).send('Password must be at least 9 characters long and include at least one number and one special symbol.');
    }
    
    // New users are "customer" by default
    const newUser = new User({ name, email, password, role: 'customer' });
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(newUser.password, 10);
    newUser.password = hashedPassword;
    await newUser.save();
    
    req.session.user = { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, avatar: newUser.avatar };
    res.redirect('/');
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send('Registration failed. Please try again.');
  }
});

// Sign-in routes
app.get('/signin', (req, res) => {
  res.render('signin');
});

app.post('/signin', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).send('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(401).send('Invalid email or password');
    }
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar };
    res.redirect('/');
  } catch (error) {
    console.error('Error during sign in:', error);
    res.status(500).send('Sign in failed. Please try again.');
  }
});

// Sign-out route
app.get('/signout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

/* -------------- Admin Panel Routes (Admins Only) -------------- */

// View all users (admin only)
app.get('/admin/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.render('admin-users', { users });
  } catch (err) {
    res.status(500).send("Error retrieving users");
  }
});

// Create a new user via admin panel
app.post('/admin/users/create', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();
    res.redirect('/admin/users');
  } catch (err) {
    res.status(500).send("Error creating user");
  }
});

// Update user role via admin panel
app.post('/admin/users/:id/update', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.redirect('/admin/users');
  } catch (err) {
    res.status(500).send("Error updating user");
  }
});

// Delete a user via admin panel
app.post('/admin/users/:id/delete', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/users');
  } catch (err) {
    res.status(500).send("Error deleting user");
  }
});

/* ---------------- Profile & Posts ---------------- */

// Profile route – accessible only if signed in
app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.session.user.id }).sort({ createdAt: -1 });
    res.render('profile', { posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).send('Error fetching posts.');
  }
});

// Create a new post on profile
app.post('/profile/post', isAuthenticated, async (req, res) => {
  try {
    const newPost = new Post({
      user: req.session.user.id,
      content: req.body.content
    });
    await newPost.save();
    res.redirect('/profile');
  } catch (error) {
    console.error('Error saving post:', error);
    res.status(500).send('Error saving post.');
  }
});

// Profile update route
app.post('/profile/update', isAuthenticated, async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      email: req.body.email
    };
    if (req.body.password && req.body.password.trim().length > 0) {
      updateData.password = req.body.password;
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user.id,
      updateData,
      { new: true, runValidators: true }
    );
    req.session.user.name = updatedUser.name;
    req.session.user.email = updatedUser.email;
    res.redirect('/profile');
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).send('Error updating profile.');
  }
});

/* ---------- Avatar Upload (Profile) ---------- */
const uploadDir = path.join(__dirname, 'public', 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.post('/profile/avatar', isAuthenticated, upload.single('avatar'), async (req, res) => {
  try {
    const avatarPath = '/uploads/avatars/' + req.file.filename;
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user.id,
      { avatar: avatarPath },
      { new: true, runValidators: true }
    );
    req.session.user.avatar = updatedUser.avatar;
    res.redirect('/profile');
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).send('Error uploading avatar.');
  }
});

/* ---------------- Products Routes ---------------- */

// Products list
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.render('products', { products });
  } catch (err) {
    res.status(500).send('Error retrieving products.');
  }
});

// Product details
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send('Product not found');
    res.render('product-details', { product });
  } catch (err) {
    res.status(500).send('Error retrieving product details.');
  }
});

// Add new product
app.post('/products', async (req, res) => {
  try {
    const newProduct = new Product({
      title: req.body.title,
      categorie: req.body.category, // note: "categorie" field per your schema?
      price: req.body.price,
      tags: req.body.tags ? req.body.tags.split(',') : [],
      description: req.body.description,
      image: req.body.image
    });
    await newProduct.save();
    console.log(`Product added successfully: ${newProduct.title}`);
    res.redirect('/products');
  } catch (err) {
    console.error('Error adding product:', err.message);
    res.status(400).send('Error adding product.');
  }
});

// Update product
app.post('/products/:id/update', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { title: req.body.title },
      { new: true, runValidators: true }
    );
    if (!updatedProduct) return res.status(404).send('Product not found');
    res.redirect('/products');
  } catch (err) {
    res.status(400).send('Error updating product.');
  }
});

// Delete product
app.post('/products/:id/delete', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).send('Product not found');
    res.redirect('/products');
  } catch (err) {
    res.status(500).send('Error deleting product.');
  }
});

/* --------------- CART & ORDER ROUTES --------------- */

// Add to Cart route
app.post('/cart/add', (req, res) => {
  const productId = req.body.productId;
  const quantity = parseInt(req.body.quantity) || 1;
  if (!req.session.cart) {
    req.session.cart = [];
  }
  const cartItem = req.session.cart.find(item => item.productId === productId);
  if (cartItem) {
    cartItem.quantity += quantity;
  } else {
    req.session.cart.push({ productId, quantity });
  }
  res.redirect('/products');
});

// Update Cart Quantity
app.post('/cart/update', (req, res) => {
  const productId = req.body.productId;
  const quantity = parseInt(req.body.quantity);
  if (req.session.cart) {
    const item = req.session.cart.find(i => i.productId === productId);
    if (item) {
      item.quantity = quantity;
    }
  }
  res.redirect('/order');
});

// Remove Item from Cart
app.post('/cart/remove', (req, res) => {
  const productId = req.body.productId;
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(item => item.productId !== productId);
  }
  res.redirect('/order');
});

// Order Page – accessible only if signed in
app.get('/order', isAuthenticated, async (req, res) => {
  const cart = req.session.cart || [];
  try {
    const productsInCart = await Promise.all(cart.map(async item => {
      const product = await Product.findById(item.productId);
      return { product, quantity: item.quantity };
    }));
    res.render('order', { cart: productsInCart });
  } catch (error) {
    console.error('Error fetching cart products:', error);
    res.status(500).send('Error fetching cart products.');
  }
});

// Place Order – saves order to MongoDB and clears cart
app.post('/order/place', isAuthenticated, async (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }
  try {
    const order = new Order({
      user_id: req.session.user.id,
      items: cart.map(item => ({
        product_id: item.productId,
        quantity: item.quantity
      }))
    });
    await order.save();
    req.session.cart = [];
    res.json({ message: "Order placed successfully!" });
  } catch (error) {
    console.error("Error placing order", error);
    res.status(500).json({ message: "Error placing order" });
  }
});

/* -------------------- QUIZ ROUTES -------------------- */

// Quiz Page – accessible only if signed in
app.get('/quiz', isAuthenticated, (req, res) => {
  res.render('quiz');
});

// Process Quiz Result
app.post('/quiz-result', isAuthenticated, async (req, res) => {
  const { skinTone, vibe, zodiac, vibeDetail } = req.body;
  let recommendedRing = {};
  if (skinTone === 'light') {
    recommendedRing.metal = 'rose gold';
  } else if (skinTone === 'medium') {
    recommendedRing.metal = 'yellow gold';
  } else {
    recommendedRing.metal = 'platinum';
  }
  if (vibe === 'classic') {
    recommendedRing.style = 'vintage design';
  } else if (vibe === 'modern') {
    recommendedRing.style = 'sleek minimalist';
  } else if (vibe === 'edgy') {
    recommendedRing.style = 'geometric, bold design';
  } else {
    recommendedRing.style = 'romantic, intricate design';
  }
  switch (zodiac) {
    case 'aries':
      recommendedRing.gemstone = 'diamond';
      break;
    case 'taurus':
      recommendedRing.gemstone = 'emerald';
      break;
    default:
      recommendedRing.gemstone = 'sapphire';
  }
  const quizResult = {
    metal: recommendedRing.metal,
    style: recommendedRing.style,
    gemstone: recommendedRing.gemstone
  };
  res.render('quiz-result', { quizResult });
});

/* ---------------------------------------------------- */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
