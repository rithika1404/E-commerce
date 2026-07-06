import React, { useState, useEffect } from 'react';
import ProductCard from './components/ProductCard';
import CartSidebar from './components/CartSidebar';
import AuthModal from './components/AuthModal';
import OrdersModal from './components/OrdersModal';
import ThemeSwitcher from './components/ThemeSwitcher';
import { apiUrl } from './api';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Shopixo';

const themes = {
  'sky-purple': { gradient: 'linear-gradient(-45deg, #7dd3fc, #ffffff, #c084fc, #bae6fd)', dark: false },
  'sunset': { gradient: 'linear-gradient(-45deg, #f093fb, #f5576c, #fccb90, #ffffff)', dark: false },
  'ocean': { gradient: 'linear-gradient(-45deg, #4facfe, #00f2fe, #ffffff, #a1c4fd)', dark: false },
  'emerald': { gradient: 'linear-gradient(-45deg, #d4fc79, #96e6a1, #ffffff, #84fab0)', dark: false },
  'midnight': { gradient: 'linear-gradient(-45deg, #0f172a, #1e293b, #3b0764, #0f172a)', dark: true },
  'cotton': { gradient: 'linear-gradient(-45deg, #ff9a9e, #fecfef, #a18cd1, #fbc2eb)', dark: false }
};

export default function App() {
  const [theme, setTheme] = useState('sky-purple');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('aura-selected-theme') || 'sky-purple';
    applyTheme(savedTheme);

    const savedUser = localStorage.getItem('aura-user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      syncCartWithBackend(parsed.userId);
      fetchOrders(parsed.userId);
    } else {
      const localCart = localStorage.getItem('aura-guest-cart');
      if (localCart) setCart(JSON.parse(localCart));
    }
    fetchProductsList();
  }, []);

  const applyTheme = (themeKey) => {
    const th = themes[themeKey];
    if (!th) return;
    document.body.style.background = th.gradient;
    document.body.style.backgroundSize = '400% 400%';
    if (th.dark) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
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

  const handleAuthSuccess = async (userData) => {
    setUser(userData);
    localStorage.setItem('aura-user', JSON.stringify(userData));
    const guestCart = JSON.parse(localStorage.getItem('aura-guest-cart') || '[]');
    if (guestCart.length > 0) {
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

  const handleAddToCart = async (product) => {
    if (user) {
      try {
        const response = await fetch(apiUrl(`/api/cart/${user.userId}`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });
        if (response.ok) syncCartWithBackend(user.userId);
      } catch (err) {
        console.error('Error adding to backend cart:', err);
      }
    } else {
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
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = async (itemId, change) => {
    const item = cart.find(i => (i.productId || i.id) === itemId);
    if (!item) return;
    const targetQty = item.quantity + change;
    if (user) {
      try {
        if (targetQty <= 0) {
          await fetch(apiUrl(`/api/cart/${user.userId}/${itemId}`), { method: 'DELETE' });
        } else {
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
          <div className="cart-icon" onClick={() => setIsCartOpen(true)} style={{ position: 'relative' }}>
            <i className="fa-solid fa-bag-shopping"></i>
            <span id="cart-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          {user ? (
            <div className={`user-profile-menu ${isProfileDropdownOpen ? 'active' : ''}`}>
              <div className="user-profile-trigger" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                <i className="fa-regular fa-circle-user" style={{ fontSize: '1.2rem' }}></i>
                <span>{user.name}</span>
                <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.8rem', opacity: 0.6 }}></i>
              </div>
              <div className="profile-dropdown">
                <button className="profile-dropdown-item" onClick={() => { setIsOrdersModalOpen(true); setIsProfileDropdownOpen(false); }}>
                  <i className="fa-solid fa-receipt"></i> Order History
                </button>
                <button className="profile-dropdown-item" onClick={handleLogout}>
                  <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button className="nav-btn-auth" onClick={() => setIsAuthModalOpen(true)}>Sign In</button>
          )}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════
          HERO SECTION — Premium Two-Column Split Layout
          ═══════════════════════════════════════════════ */}
      <header id="home" className="hero hero-split">

        {/* ── LEFT COLUMN: Copy & CTAs ── */}
        <div className="hero-left">

          {/* Eyebrow */}
          <div className="hero-eyebrow">
            <span className="eyebrow-dot"></span>
            Trusted by 50,000+ happy shoppers across India
          </div>

          {/* Headline */}
          <h1 className="hero-heading">
            Shop Smarter.<br />
            <span className="hero-highlight">Live Better.</span>
          </h1>

          {/* Description */}
          <p className="hero-desc">
            Explore a world of premium tech, lifestyle gadgets, and must-have accessories —
            all handpicked for quality and value. Fast delivery, hassle-free returns,
            and a shopping experience you will actually love.
          </p>

          {/* CTA Buttons */}
          <div className="hero-cta-row">
            <a href="#shop" className="hero-btn-primary" id="hero-shop-btn">
              <i className="fa-solid fa-bag-shopping"></i>
              Shop Now
              <i className="fa-solid fa-arrow-right hero-btn-arrow"></i>
            </a>
            <a href="#categories" className="hero-btn-secondary" id="hero-categories-btn">
              <i className="fa-solid fa-grid-2"></i>
              Explore Categories
            </a>
          </div>

          {/* Trust Badges */}
          <div className="hero-trust-badges">
            <div className="trust-badge-card">
              <div className="tbc-icon"><i className="fa-solid fa-truck-fast"></i></div>
              <div className="tbc-text">
                <strong>Free Delivery</strong>
                <span>On orders above &#8377;999</span>
              </div>
            </div>
            <div className="trust-badge-card">
              <div className="tbc-icon"><i className="fa-solid fa-lock"></i></div>
              <div className="tbc-text">
                <strong>Secure Payments</strong>
                <span>100% encrypted checkout</span>
              </div>
            </div>
            <div className="trust-badge-card">
              <div className="tbc-icon"><i className="fa-solid fa-rotate-left"></i></div>
              <div className="tbc-text">
                <strong>Easy Returns</strong>
                <span>30-day hassle-free</span>
              </div>
            </div>
            <div className="trust-badge-card">
              <div className="tbc-icon"><i className="fa-solid fa-certificate"></i></div>
              <div className="tbc-text">
                <strong>Quality Assured</strong>
                <span>Certified products only</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="hero-stats-row">
            <div className="hero-stat-item">
              <span className="stat-num">50K+</span>
              <span className="stat-lbl">Happy Customers</span>
            </div>
            <div className="stat-sep"></div>
            <div className="hero-stat-item">
              <span className="stat-num">500+</span>
              <span className="stat-lbl">Products Available</span>
            </div>
            <div className="stat-sep"></div>
            <div className="hero-stat-item">
              <span className="stat-num">4.9&#9733;</span>
              <span className="stat-lbl">Customer Rating</span>
            </div>
            <div className="stat-sep"></div>
            <div className="hero-stat-item">
              <span className="stat-num">120+</span>
              <span className="stat-lbl">Trusted Brands</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Visual Showcase ── */}
        <div className="hero-right">

          {/* Main Product Image */}
          <div className="hero-main-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=85"
              alt="Premium Smartwatch"
              className="hero-main-img"
              loading="eager"
            />
            {/* Discount Badge */}
            <div className="hero-discount-badge">
              <span>UP TO</span>
              <strong>40%</strong>
              <span>OFF</span>
            </div>
          </div>

          {/* Floating Card — Top Left */}
          <div className="hero-float-card hero-float-top">
            <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&q=80" alt="Headphones" />
            <div className="float-card-info">
              <p>Premium Headphones</p>
              <strong>&#8377;24,999</strong>
            </div>
            <span className="float-tag float-tag-fire">&#128293; Hot</span>
          </div>

          {/* Floating Card — Bottom Right */}
          <div className="hero-float-card hero-float-bottom">
            <img src="https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=120&q=80" alt="Gaming Pad" />
            <div className="float-card-info">
              <p>RGB Gaming Pad XXL</p>
              <strong>&#8377;3,299</strong>
            </div>
            <span className="float-tag float-tag-green">&#11088; New</span>
          </div>

          {/* Live Order Notification */}
          <div className="hero-live-notif">
            <div className="notif-avatar">AK</div>
            <div className="notif-body">
              <strong>Arjun K.</strong> just ordered
              <span>Wireless Earbuds Pro</span>
            </div>
            <div className="notif-live-dot"></div>
          </div>
        </div>
      </header>

      {/* Categories */}
      <section id="categories" className="categories-section">
        <div className="section-header">
          <span className="section-badge">Collections</span>
          <h2>Shop by Category</h2>
          <p>Explore our handpicked selection across every lifestyle need</p>
        </div>
        <div className="category-grid-new">
          <div className="category-card-featured" style={{ backgroundImage: "linear-gradient(135deg, rgba(30,30,60,0.55), rgba(0,0,0,0.75)), url('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80')" }}>
            <div className="cat-tag"><i className="fa-solid fa-headphones"></i> Trending</div>
            <div className="cat-info">
              <h3>Audio &amp; Sound</h3>
              <p>Headphones, earbuds, speakers &amp; more</p>
              <a href="#shop" className="cat-btn">Browse All <i className="fa-solid fa-arrow-right"></i></a>
            </div>
          </div>
          <div className="category-col-right">
            <div className="category-card-small" style={{ backgroundImage: "linear-gradient(135deg, rgba(20,40,80,0.55), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80')" }}>
              <div className="cat-tag"><i className="fa-solid fa-fire"></i> Hot</div>
              <div className="cat-info">
                <h3>Wearables</h3>
                <p>Smartwatches &amp; fitness bands</p>
                <a href="#shop" className="cat-btn">Explore <i className="fa-solid fa-arrow-right"></i></a>
              </div>
            </div>
            <div className="category-card-small" style={{ backgroundImage: "linear-gradient(135deg, rgba(60,20,80,0.55), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&q=80')" }}>
              <div className="cat-tag"><i className="fa-solid fa-star"></i> New</div>
              <div className="cat-info">
                <h3>Accessories</h3>
                <p>Cables, stands, hubs &amp; docks</p>
                <a href="#shop" className="cat-btn">Explore <i className="fa-solid fa-arrow-right"></i></a>
              </div>
            </div>
          </div>
        </div>
        <div className="category-row-bottom">
          <div className="category-card-wide" style={{ backgroundImage: "linear-gradient(135deg, rgba(10,40,30,0.6), rgba(0,0,0,0.75)), url('https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=700&q=80')" }}>
            <div className="cat-tag"><i className="fa-solid fa-laptop"></i> Popular</div>
            <div className="cat-info">
              <h3>Laptops &amp; Computing</h3>
              <p>Ultrabooks, accessories &amp; peripherals</p>
              <a href="#shop" className="cat-btn">Shop Now <i className="fa-solid fa-arrow-right"></i></a>
            </div>
          </div>
          <div className="category-card-wide" style={{ backgroundImage: "linear-gradient(135deg, rgba(60,30,10,0.6), rgba(0,0,0,0.75)), url('https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&q=80')" }}>
            <div className="cat-tag"><i className="fa-solid fa-mobile-screen"></i> Top Rated</div>
            <div className="cat-info">
              <h3>Mobile &amp; Tablets</h3>
              <p>Cases, chargers &amp; mobile gear</p>
              <a href="#shop" className="cat-btn">Shop Now <i className="fa-solid fa-arrow-right"></i></a>
            </div>
          </div>
          <div className="category-card-wide" style={{ backgroundImage: "linear-gradient(135deg, rgba(10,10,60,0.6), rgba(0,0,0,0.75)), url('https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=700&q=80')" }}>
            <div className="cat-tag"><i className="fa-solid fa-gamepad"></i> Gaming</div>
            <div className="cat-info">
              <h3>Gaming Gear</h3>
              <p>Controllers, mice, keyboards &amp; more</p>
              <a href="#shop" className="cat-btn">Shop Now <i className="fa-solid fa-arrow-right"></i></a>
            </div>
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
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </main>

      {/* Reviews / Testimonials */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <span className="section-badge"><i className="fa-solid fa-heart"></i> Customers Love Us</span>
          <h2>What Our Customers Say</h2>
          <p>Real stories from real shoppers who trust Shopixo</p>
          <div className="rating-summary">
            <span className="rating-big">4.9</span>
            <div className="rating-detail">
              <div className="stars-lg">
                <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star-half-stroke"></i>
              </div>
              <span>Based on 12,400+ reviews</span>
            </div>
          </div>
        </div>

        <div className="testimonial-featured">
          <i className="fa-solid fa-quote-left quote-icon"></i>
          <p>"I've been shopping online for over a decade, and Meesho genuinely stands out. The product quality rivals brands that charge 3x the price, delivery was faster than expected, and when I had a small issue with my order, support resolved it within the hour. This is what e-commerce should feel like."</p>
          <div className="testimonial-author-featured">
            <div className="avatar avatar-lg">PR</div>
            <div>
              <strong>Priya R.</strong>
              <span>Verified Buyer &middot; Mumbai</span>
            </div>
            <div className="stars" style={{ marginLeft: 'auto' }}>
              <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
            </div>
          </div>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-top">
              <div className="avatar">SJ</div>
              <div><strong>Sarah J.</strong><span className="verified-badge"><i className="fa-solid fa-circle-check"></i> Verified</span></div>
              <div className="stars" style={{ marginLeft: 'auto' }}><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i></div>
            </div>
            <p>"The quality of these products is unmatched. Customer service was incredibly helpful! My Sony headphones arrived in perfect condition."</p>
            <div className="testimonial-product-tag"><i className="fa-solid fa-bag-shopping"></i> Purchased: Sony WH-1000XM5</div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-top">
              <div className="avatar">MT</div>
              <div><strong>Michael T.</strong><span className="verified-badge"><i className="fa-solid fa-circle-check"></i> Verified</span></div>
              <div className="stars" style={{ marginLeft: 'auto' }}><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-regular fa-star"></i></div>
            </div>
            <p>"Fast shipping and the smartwatch I ordered looks even better in person. The build quality feels super premium for this price."</p>
            <div className="testimonial-product-tag"><i className="fa-solid fa-bag-shopping"></i> Purchased: Apple Watch Ultra</div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-top">
              <div className="avatar">ER</div>
              <div><strong>Emily R.</strong><span className="verified-badge"><i className="fa-solid fa-circle-check"></i> Verified</span></div>
              <div className="stars" style={{ marginLeft: 'auto' }}><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i></div>
            </div>
            <p>"I've bought my entire desk setup here — monitor stand, hub, keyboard. The minimalist aesthetic is exactly what I was after!"</p>
            <div className="testimonial-product-tag"><i className="fa-solid fa-bag-shopping"></i> Purchased: Desk Accessories Bundle</div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-top">
              <div className="avatar">AK</div>
              <div><strong>Arjun K.</strong><span className="verified-badge"><i className="fa-solid fa-circle-check"></i> Verified</span></div>
              <div className="stars" style={{ marginLeft: 'auto' }}><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i></div>
            </div>
            <p>"Ordered gaming gear for my setup and could not be happier. The mechanical keyboard has a perfect tactile feel and looks stunning with RGB lighting."</p>
            <div className="testimonial-product-tag"><i className="fa-solid fa-bag-shopping"></i> Purchased: Mechanical Keyboard Pro</div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-top">
              <div className="avatar">NM</div>
              <div><strong>Neha M.</strong><span className="verified-badge"><i className="fa-solid fa-circle-check"></i> Verified</span></div>
              <div className="stars" style={{ marginLeft: 'auto' }}><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i></div>
            </div>
            <p>"The return process was seamless when I needed a different cable size. Support was responsive and friendly. Will definitely order again!"</p>
            <div className="testimonial-product-tag"><i className="fa-solid fa-bag-shopping"></i> Purchased: USB-C Hub</div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-top">
              <div className="avatar">RS</div>
              <div><strong>Rahul S.</strong><span className="verified-badge"><i className="fa-solid fa-circle-check"></i> Verified</span></div>
              <div className="stars" style={{ marginLeft: 'auto' }}><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-regular fa-star"></i></div>
            </div>
            <p>"Honestly surprised at how good the packaging was. The product came wrapped beautifully — felt like opening a gift. Great first experience!"</p>
            <div className="testimonial-product-tag"><i className="fa-solid fa-bag-shopping"></i> Purchased: TWS Earbuds Pro</div>
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
              <li><a href="#">Shipping &amp; Returns</a></li>
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
        onPromptLogin={() => { setIsCartOpen(false); setIsAuthModalOpen(true); }}
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
      <ThemeSwitcher currentTheme={theme} onSelectTheme={applyTheme} />
    </>
  );
}
