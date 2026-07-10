require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173';
const allowedOrigins = CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// In-Memory Data Stores
let products = [
  // ── Audio ────────────────────────────────────────────────────────────────────
  { id: 1,  name: 'Premium Wireless Headphones',        price: 299.99, category: 'Audio',       image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',  description: 'High-quality noise-canceling wireless headphones with 30-hr battery.' },
  { id: 10, name: 'Noise-Canceling Wireless Earbuds',   price: 179.99, category: 'Audio',       image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80',  description: 'Compact wireless earbuds with active noise cancellation and 24-hr case.' },
  { id: 6,  name: 'Portable Bluetooth Speaker',         price: 129.00, category: 'Audio',       image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80',  description: 'Rugged and loud portable bluetooth speaker with 20-hr battery.' },
  { id: 15, name: 'Pro USB Condenser Microphone',       price: 119.00, category: 'Audio',       image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&q=80',  description: 'Crystal-clear audio microphone for streaming, podcasts, and calls.' },
  { id: 19, name: 'Open-Back Studio Headphones',        price: 249.00, category: 'Audio',       image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&q=80',  description: 'Professional open-back headphones for studio monitoring and mixing.' },

  // ── Wearables ────────────────────────────────────────────────────────────────
  { id: 2,  name: 'Minimalist Smartwatch',              price: 199.50, category: 'Wearables',   image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',  description: 'Sleek smartwatch with health tracking and AMOLED display.' },
  { id: 20, name: 'Smart Fitness Band Pro',             price: 89.99,  category: 'Wearables',   image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&q=80',  description: 'Track steps, heart rate, sleep and SpO2 with a sleek slim design.' },
  { id: 21, name: 'GPS Running Smartwatch',             price: 349.00, category: 'Wearables',   image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&q=80',  description: 'Built-in GPS running watch with multi-sport modes and ANT+ support.' },

  // ── Accessories ──────────────────────────────────────────────────────────────
  { id: 3,  name: 'Mechanical Keyboard',                price: 149.00, category: 'Accessories', image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80',  description: 'RGB mechanical keyboard with satisfying tactile switches.' },
  { id: 4,  name: 'Ergonomic Wireless Mouse',           price: 79.99,  category: 'Accessories', image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80',  description: 'Comfortable wireless ergonomic mouse with silent click.' },
  { id: 11, name: 'Multi-port USB-C Hub',               price: 39.99,  category: 'Accessories', image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=500&q=80',  description: 'Aluminum USB-C hub with HDMI, USB 3.0, and SD card slots.' },
  { id: 13, name: 'Premium Leather Desk Mat',           price: 34.99,  category: 'Accessories', image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=500&q=80',  description: 'Waterproof dual-sided leather desk pad for a clean minimal setup.' },
  { id: 8,  name: '3-in-1 Wireless Charging Station',  price: 49.99,  category: 'Accessories', image: 'https://images.unsplash.com/photo-1622445262465-2481c457487f?w=500&q=80',  description: 'Fast-charge your phone, watch, and earbuds simultaneously.' },

  // ── Laptops & Computing ──────────────────────────────────────────────────────
  { id: 12, name: '34-inch Curved UltraWide Monitor',   price: 499.99, category: 'Laptops',     image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80',  description: 'Immersive curved monitor for productivity and gaming.' },
  { id: 17, name: 'Portable 2TB External SSD',          price: 149.99, category: 'Laptops',     image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&q=80',  description: 'Ultra-fast and durable external storage drive for creators.' },
  { id: 14, name: 'Smart Wi-Fi 6 Router',               price: 89.99,  category: 'Laptops',     image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80',     description: 'High-speed Wi-Fi 6 router supporting 50+ simultaneous devices.' },
  { id: 22, name: 'Laptop Cooling Pad RGB',             price: 44.99,  category: 'Laptops',     image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&q=80',  description: 'Quiet RGB cooling pad with 5 fans and adjustable height stand.' },
  { id: 23, name: 'Wireless Keyboard & Mouse Combo',    price: 69.99,  category: 'Laptops',     image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',  description: 'Full-size wireless keyboard and mouse with nano USB receiver.' },

  // ── Mobile & Tablets ─────────────────────────────────────────────────────────
  { id: 18, name: '1080p Webcam with Ring Light',       price: 69.99,  category: 'Mobile',      image: 'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?w=500&q=80',  description: 'HD webcam with adjustable ring light for professional video calls.' },
  { id: 24, name: 'MagSafe Magnetic Phone Stand',       price: 29.99,  category: 'Mobile',      image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500&q=80',  description: 'Aluminum MagSafe-compatible desk stand with 360 degree rotation.' },
  { id: 25, name: '65W GaN Fast Charger',               price: 54.99,  category: 'Mobile',      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&q=80',  description: 'Compact 3-port GaN charger — power your laptop, phone and tablet at once.' },
  { id: 26, name: 'Wireless Power Bank 20000mAh',       price: 79.99,  category: 'Mobile',      image: 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=500&q=80',  description: 'Slim 20,000 mAh power bank with Qi wireless and 65W wired charging.' },

  // ── Gaming ───────────────────────────────────────────────────────────────────
  { id: 5,  name: '4K Action Camera',                   price: 349.99, category: 'Gaming',      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80',  description: 'Waterproof 4K action camera with HyperSmooth stabilization.' },
  { id: 27, name: 'Mechanical Gaming Keyboard TKL',     price: 169.00, category: 'Gaming',      image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&q=80',  description: 'Tenkeyless RGB gaming keyboard with per-key customizable lighting.' },
  { id: 28, name: 'Gaming Headset 7.1 Surround',        price: 129.99, category: 'Gaming',      image: 'https://images.unsplash.com/photo-1583394293214-0d5f69285538?w=500&q=80',  description: 'Immersive 7.1 virtual surround sound headset with RGB earcups.' },
  { id: 29, name: 'Pro Gaming Mouse 25600 DPI',         price: 89.99,  category: 'Gaming',      image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&q=80',  description: 'Ultra-precision gaming mouse with 11 programmable buttons.' },
  { id: 30, name: 'RGB Gaming Mousepad XXL',            price: 39.99,  category: 'Gaming',      image: 'https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=500&q=80',  description: 'Extra-large 900x400mm gaming desk pad with 14 RGB lighting modes.' },

  // ── Smart Home ───────────────────────────────────────────────────────────────
  { id: 7,  name: 'Smart Temperature Control Mug',      price: 99.99,  category: 'Smart Home',  image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80',  description: 'Keep your coffee at the perfect temperature all day.' },
  { id: 9,  name: 'Smart RGB LED Light Strip 5m',       price: 29.99,  category: 'Smart Home',  image: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=500&q=80',  description: 'Vibrant smart lighting with app control and music sync.' },
  { id: 16, name: 'LED Desk Lamp with Wireless Charger', price: 59.99, category: 'Smart Home',  image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80',  description: 'Dimmable smart LED lamp with built-in Qi wireless charging pad.' },
];

// Pre-seeded demo account
let users = [
  { id: 1, name: 'Demo User', email: 'demo@meesho.com', password: 'demo1234' }
];
let carts = { 1: [] }; // Initialize demo user's cart
let orders = [];

// ========================
// PRODUCTS API
// ========================
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// ========================
// USERS API
// ========================
app.post('/api/users/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const newUser = { id: users.length + 1, name, email, password };
  users.push(newUser);
  carts[newUser.id] = []; // Initialize empty cart for user
  
  res.status(201).json({ message: 'User created', userId: newUser.id });
});

app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  res.json({ message: 'Login successful', userId: user.id, name: user.name });
});

// ========================
// CART API
// ========================
// In a real app, userId would come from a JWT token in the headers. 
// For this mock, we'll expect it in the query params or body.

app.get('/api/cart/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const cart = carts[userId] || [];
  res.json(cart);
});

app.post('/api/cart/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const { productId, quantity = 1 } = req.body;
  
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (!carts[userId]) carts[userId] = [];
  
  const existingItem = carts[userId].find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    carts[userId].push({ productId, name: product.name, price: product.price, quantity });
  }

  res.json({ message: 'Item added to cart', cart: carts[userId] });
});

app.delete('/api/cart/:userId/:productId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const productId = parseInt(req.params.productId);
  
  if (!carts[userId]) return res.status(404).json({ error: 'Cart not found' });

  carts[userId] = carts[userId].filter(item => item.productId !== productId);
  res.json({ message: 'Item removed from cart', cart: carts[userId] });
});

// ========================
// ORDERS API
// ========================
app.get('/api/orders/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const userOrders = orders.filter(o => o.userId === userId);
  res.json(userOrders);
});

app.post('/api/orders/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const cart = carts[userId];

  if (!cart || cart.length === 0) {
    return res.status(400).json({ error: 'Cannot create order with an empty cart' });
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const newOrder = {
    id: orders.length + 1,
    userId,
    items: [...cart],
    total,
    date: new Date().toISOString(),
    status: 'Pending'
  };

  orders.push(newOrder);
  carts[userId] = []; // Clear the cart after order

  res.status(201).json({ message: 'Order created successfully', order: newOrder });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend API server is running on http://localhost:${PORT}`);
});
