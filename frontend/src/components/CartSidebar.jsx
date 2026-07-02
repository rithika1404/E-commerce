import React from 'react';

export default function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  products,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  user,
  onPromptLogin
}) {
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckoutClick = () => {
    if (!user) {
      onPromptLogin();
    } else {
      onCheckout();
    }
  };

  return (
    <>
      <div className={`overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
      
      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Your Shopping Bag</h2>
          <button id="close-cart" onClick={onClose} aria-label="Close cart">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--text-light)' }}>
              <i className="fa-solid fa-cart-shopping" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}></i>
              <p>Your bag is empty.</p>
            </div>
          ) : (
            cartItems.map((item) => {
              // Find matching product image from products catalog
              const matchedProduct = products.find(p => p.id === (item.productId || item.id));
              const itemImage = matchedProduct ? matchedProduct.image : item.image;

              return (
                <div key={item.productId || item.id} className="cart-item">
                  <img src={itemImage} alt={item.name} />
                  <div className="item-details">
                    <div className="item-title">{item.name}</div>
                    <div className="item-price">${item.price.toFixed(2)}</div>
                    <div className="qty-controls">
                      <button
                        className="qty-btn"
                        onClick={() => onUpdateQuantity(item.productId || item.id, -1)}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => onUpdateQuantity(item.productId || item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="remove-item"
                    onClick={() => onRemoveItem(item.productId || item.id)}
                    aria-label="Remove item"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-total-row">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckoutClick}
            disabled={cartItems.length === 0}
            className="btn btn-primary btn-checkout"
            style={{ width: '100%', cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            {user ? 'Proceed to Checkout' : 'Login to Checkout'}
          </button>
        </div>
      </div>
    </>
  );
}
