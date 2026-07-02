import React from 'react';

export default function OrdersModal({ isOpen, onClose, orders }) {
  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="modal-header">
          <h2>Order History</h2>
          <p>Review your previous purchases</p>
        </div>

        <div className="orders-list">
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-light)' }}>
              <i className="fa-solid fa-receipt" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}></i>
              <p>You haven't placed any orders yet.</p>
            </div>
          ) : (
            orders.slice().reverse().map((order) => {
              const formattedDate = new Date(order.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={order.id} className="order-item">
                  <div className="order-meta">
                    <span className="order-id">Order #{order.id}</span>
                    <span className="order-date">{formattedDate}</span>
                    <span className={`order-status ${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="order-products">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-product-row">
                        <span>
                          {item.name} <strong style={{ color: 'var(--text-light)' }}>x{item.quantity}</strong>
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-total-row">
                    <span>Total Amount</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
