import React, { useState, useEffect } from 'react';
import ProductCard from './components/ProductCard';
import CartSidebar from './components/CartSidebar';
import AuthModal from './components/AuthModal';
import OrdersModal from './components/OrdersModal';
import ThemeSwitcher from './components/ThemeSwitcher';
import { apiUrl } from './api';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Meesho';

const themes = {
  'sky-purple': { gradient: 'linear-gradient(-45deg, #7dd3fc, #ffffff, #c084fc, #bae6fd)', dark: false },
  'sunset': { gradient: 'linear-gradient(-45deg, #f093fb, #f5576c, #fccb90, #ffffff)', dark: false },
  'ocean': { gradient: 'linear-gradient(-45deg, #4facfe, #00f2fe, #ffffff, #a1c4fd)', dark: false },
  'emerald': { gradient: 'linear-gradient(-45deg, #d4fc79, #96e6a1, #ffffff, #84fab0)', dark: false },
  'midnight': { gradient: 'linear-gradient(-45deg, #0f172a, #1e293b, #3b0764, #0f172a)', dark: true },
  'cotton': { gradient: 'linear-gradient(-45deg, #ff9a9e, #fecfef, #a18cd1, #fbc2eb)', dark: false }
};

export default function App() {
  // Theme state
  const [theme, setTheme] = useState('sky-purple');

  // App States
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(false);

  // Modals and UI Toggles
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Load theme and auth on startup
  useEffect(() => {
    // Load Theme
    const savedTheme = localStorage.getItem('aura-selected-theme') || 'sky-purple';
    applyTheme(savedTheme);

    // Load User
    const savedUser = localStorage.getItem('aura-user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      syncCartWithBackend(parsed.userId);
      fetchOrders(parsed.userId);
    } else {
      // Local Guest Cart initialization
      const localCart = localStorage.getItem('aura-guest-cart');
      if (localCart) {
        setCart(JSON.parse(localCart));
      }
    }

    // Load Products
    fetchProductsList();
  }, []);

  const applyTheme = (themeKey) => {
    const th = themes[themeKey];
    if (!th) return;
    document.body.style.background = th.gradient;
    document.body.style.backgroundSize = '400% 400%';
    if (th.dark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    setTheme(themeKey);
    localStorage.setItem('aura-selected-theme', themeKey);
  };

  const fetchProductsList = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch(apiUrl('/api/products'));
      if (!response.ok) throw new Error('Failed to load products');
      const data = await response.json();
      setProducts(data);
      setErrorProducts(false);
    } catch (err) {
      console.error(err);
      setErrorProducts(true);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Sync / fetch cart from backend
  const syncCartWithBackend = async (userId) => {
    try {
      const response = await fetch(apiUrl(`/api/cart/${userId}`));
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (err) {
      console.error('Error syncing cart:', err);
    }
  };

  // Fetch orders from backend
  const fetchOrders = async (userId) => {
    try {
      const response = await fetch(apiUrl(`/api/orders/${userId}`));
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  // Auth Success Handler
  const handleAuthSuccess = async (userData) => {
    setUser(userData);
    localStorage.setItem('aura-user', JSON.stringify(userData));

    // Retrieve guest cart
    const guestCart = JSON.parse(localStorage.getItem('aura-guest-cart') || '[]');
    
    if (guestCart.length > 0) {
      // Merge guest cart with backend cart
      try {
        for (const item of guestCart) {
          await fetch(apiUrl(`/api/cart/${userData.userId}`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: item.id || item.productId, quantity: item.quantity }),
          });
        }
        localStorage.removeItem('aura-guest-cart');
      } catch (err) {
        console.error('Failed to merge guest cart:', err);
      }
    }

    // Refresh cart & orders lists
    await syncCartWithBackend(userData.userId);
    await fetchOrders(userData.userId);
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setOrders([]);
    localStorage.removeItem('aura-user');
    localStorage.removeItem('aura-guest-cart');
    setIsProfileDropdownOpen(false);
  };

  // Cart operations
  const handleAddToCart = async (product) => {
    if (user) {
      // Backend Cart Add
      try {
        const response = await fetch(apiUrl(`/api/cart/${user.userId}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });
        if (response.ok) {
          syncCartWithBackend(user.userId);
        }
      } catch (err) {
        console.error('Error adding to backend cart:', err);
      }
    } else {
      // Local Storage Guest Cart
      const existing = cart.find(item => item.id === product.id);
      let newCart;
      if (existing) {
        newCart = cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        newCart = [...cart, { id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 }];
      }
      setCart(newCart);
      localStorage.setItem('aura-guest-cart', JSON.stringify(newCart));
    }

    // Cart animation trigger (open sidebar on add)
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = async (itemId, change) => {
    const item = cart.find(i => (i.productId || i.id) === itemId);
    if (!item) return;

    const currentQty = item.quantity;
    const targetQty = currentQty + change;

    if (user) {
      // Logged-in backend sync
      try {
        if (targetQty <= 0) {
          // DELETE
          await fetch(apiUrl(`/api/cart/${user.userId}/${itemId}`), { method: 'DELETE' });
        } else {
          // POST delta
          await fetch(apiUrl(`/api/cart/${user.userId}`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: itemId, quantity: change }),
          });
        }
        syncCartWithBackend(user.userId);
      } catch (err) {
        console.error('Error updating quantity:', err);
      }
    } else {
      // Guest local sync
      let newCart;
      if (targetQty <= 0) {
        newCart = cart.filter(i => i.id !== itemId);
      } else {
        newCart = cart.map(i => i.id === itemId ? { ...i, quantity: targetQty } : i);
      }
      setCart(newCart);
      localStorage.setItem('aura-guest-cart', JSON.stringify(newCart));
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (user) {
      try {
        await fetch(apiUrl(`/api/cart/${user.userId}/${itemId}`), { method: 'DELETE' });
        syncCartWithBackend(user.userId);
      } catch (err) {
        console.error('Error deleting cart item:', err);
      }
    } else {
      const newCart = cart.filter(i => i.id !== itemId);
      setCart(newCart);
      localStorage.setItem('aura-guest-cart', JSON.stringify(newCart));
    }
  };

  const handleCheckout = async () => {
    if (!user) return;
    try {
      const response = await fetch(apiUrl(`/api/orders/${user.userId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        alert('Checkout Successful! Your order has been placed.');
        setCart([]);
        setIsCartOpen(false);
        fetchOrders(user.userId);
      } else {
        const errData = await response.json();
        alert(errData.error || 'Checkout failed');
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">{APP_NAME}</div>
        <ul className="nav-links">
          <li><a href="#home">Home</a></li>
          <li><a href="#categories">Categories</a></li>
          <li><a href="#shop">Shop</a></li>
          <li><a href="#testimonials">Reviews</a></li>
        </ul>
        
        <div className="nav-actions">
          {/* Cart Icon */}
          <div className="cart-icon" onClick={() => setIsCartOpen(true)} style={{ position: 'relative' }}>
            <i className="fa-solid fa-bag-shopping"></i>
            <span id="cart-count">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>

          {/* User authentication options */}
          {user ? (
            <div className={`user-profile-menu ${isProfileDropdownOpen ? 'active' : ''}`}>
              <div
                className="user-profile-trigger"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <i className="fa-regular fa-circle-user" style={{ fontSize: '1.2rem' }}></i>
                <span>{user.name}</span>
                <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.8rem', opacity: 0.6 }}></i>
              </div>
              <div className="profile-dropdown">
                <button
                  className="profile-dropdown-item"
                  onClick={() => {
                    setIsOrdersModalOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                >
                  <i className="fa-solid fa-receipt"></i> Order History
                </button>
                <button className="profile-dropdown-item" onClick={handleLogout}>
                  <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button className="nav-btn-auth" onClick={() => setIsAuthModalOpen(true)}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Banner */}
      <header id="home" className="hero">
        <div className="hero-content">
          <span className="badge">New Collection 2026</span>
          <h1>Redefine Your Tech Experience</h1>
          <p>Discover our meticulously curated collection of premium gadgets and accessories designed for the modern lifestyle.</p>
          <div className="hero-buttons">
            <a href="#shop" className="btn btn-primary">Shop Now</a>
            <a href="#categories" className="btn btn-secondary">Explore Categories</a>
          </div>
        </div>
      </header>

      {/* Categories */}
      <section id="categories" className="categories-section">
        <div className="section-header">
          <h2>Shop by Category</h2>
          <p>Find exactly what you're looking for</p>
        </div>
        <div className="category-grid">
          <div className="category-card" style={{ backgroundImage: "linear-gradient(rgba(61, 177, 226, 0.3), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80')" }}>
            <h3>Audio</h3>
            <a href="#shop">Browse <i className="fa-solid fa-arrow-right"></i></a>
          </div>
          <div className="category-card" style={{ backgroundImage: "linear-gradient(rgba(48, 133, 167, 0.3), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80')" }}>
            <h3>Wearables</h3>
            <a href="#shop">Browse <i className="fa-solid fa-arrow-right"></i></a>
          </div>
          <div className="category-card" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&q=80')" }}>
            <h3>Accessories</h3>
            <a href="#shop">Browse <i className="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>
      </section>

      {/* Shop / Products */}
      <main id="shop" className="shop-section">
        <div className="section-header">
          <h2>Trending Products</h2>
          <p>Our most popular items right now</p>
        </div>

        {loadingProducts ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: 'var(--secondary)', marginBottom: '1rem' }}></i>
            <p style={{ color: 'var(--text-light)' }}>Loading our collection...</p>
          </div>
        ) : errorProducts ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', background: 'var(--white)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1rem' }}></i>
            <h3>Could not connect to backend</h3>
            <p style={{ color: 'var(--text-light)' }}>Ensure your Node.js backend server is running on port 5000.</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </main>

      {/* Reviews / Testimonials */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <h2>What Our Customers Say</h2>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="stars">
              <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
            </div>
            <p>"The quality of these products is unmatched. The customer service was also incredibly helpful!"</p>
            <h4>- Sarah J.</h4>
          </div>
          <div className="testimonial-card">
            <div className="stars">
              <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-regular fa-star"></i>
            </div>
            <p>"Fast shipping and the smartwatch I ordered looks even better in person. Highly recommend Meesho."</p>
            <h4>- Michael T.</h4>
          </div>
          <div className="testimonial-card">
            <div className="stars">
              <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
            </div>
            <p>"I've bought all my desk setup accessories here. The minimalist aesthetic is exactly what I needed."</p>
            <h4>- Emily R.</h4>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <h2>Join the {APP_NAME} Community</h2>
          <p>Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
          <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }}>
            <input type="email" placeholder="Enter your email address" required />
            <button type="submit" className="btn btn-primary">Subscribe</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-grid">
          <div className="footer-col">
            <div className="logo">{APP_NAME}.</div>
            <p>Premium tech and accessories for the modern minimalist.</p>
            <div className="social-links">
              <a href="#"><i className="fa-brands fa-instagram"></i></a>
              <a href="#"><i className="fa-brands fa-twitter"></i></a>
              <a href="#"><i className="fa-brands fa-facebook-f"></i></a>
            </div>
          </div>
          <div className="footer-col">
            <h3>Shop</h3>
            <ul>
              <li><a href="#">All Products</a></li>
              <li><a href="#">Audio</a></li>
              <li><a href="#">Wearables</a></li>
              <li><a href="#">Accessories</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>Support</h3>
            <ul>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Shipping & Returns</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 {APP_NAME} E-Commerce. All rights reserved.</p>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        products={products}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        user={user}
        onPromptLogin={() => {
          setIsCartOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Orders Modal */}
      <OrdersModal
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        orders={orders}
      />

      {/* Theme Switcher Widget */}
      <ThemeSwitcher
        currentTheme={theme}
        onSelectTheme={applyTheme}
      />
    </>
  );
}
