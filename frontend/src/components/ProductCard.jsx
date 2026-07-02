import React from 'react';

export default function ProductCard({ product, onAddToCart }) {
  return (
    <div className="product-card">
      <div className="product-image-wrap">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
        <button
          className="add-to-cart-quick"
          onClick={() => onAddToCart(product)}
        >
          <i className="fa-solid fa-cart-plus"></i> Add to Cart
        </button>
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.description}
        </p>
        <div className="product-price">${product.price.toFixed(2)}</div>
      </div>
    </div>
  );
}
