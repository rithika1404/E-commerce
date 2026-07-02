import React, { useState } from 'react';
import { apiUrl } from '../api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      if (isLoginTab) {
        // Login API Call
        const response = await fetch(apiUrl('/api/users/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');

        // Store user in parent state (email prefix as fallback display name)
        const nameFromEmail = email.split('@')[0];
        const displayName = localStorage.getItem(`user-name-${data.userId}`) || nameFromEmail;
        
        onAuthSuccess({
          userId: data.userId,
          name: displayName,
          email: email
        });
        onClose();
      } else {
        // Register API Call
        const response = await fetch(apiUrl('/api/users/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registration failed');

        // Store name locally associated with this userId for display on future logins
        localStorage.setItem(`user-name-${data.userId}`, name);
        
        setSuccessMsg('Registration successful! Please login.');
        setIsLoginTab(true);
        setName('');
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="modal-header">
          <h2>{isLoginTab ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLoginTab ? 'Sign in to access your cart and orders' : 'Join us for a premium shopping experience'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="form-error">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ color: '#10b981', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="fa-solid fa-circle-check"></i>
              <span>{successMsg}</span>
            </div>
          )}

          {!isLoginTab && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {isLoginTab ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="form-footer">
          {isLoginTab ? (
            <p>
              Don't have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsLoginTab(false); setError(''); }}>
                Sign Up
              </a>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsLoginTab(true); setError(''); }}>
                Sign In
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
