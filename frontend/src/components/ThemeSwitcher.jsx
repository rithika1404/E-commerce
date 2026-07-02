import React, { useState, useEffect, useRef } from 'react';

const themeOptionsList = [
  { key: 'sky-purple', title: 'Sky Blue & Purple', bg: 'linear-gradient(135deg, #7dd3fc, #c084fc)' },
  { key: 'sunset', title: 'Sunset Glow', bg: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { key: 'ocean', title: 'Ocean Breeze', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { key: 'emerald', title: 'Forest Emerald', bg: 'linear-gradient(135deg, #d4fc79, #96e6a1)' },
  { key: 'midnight', title: 'Midnight Dark', bg: 'linear-gradient(135deg, #0f172a, #3b0764)' },
  { key: 'cotton', title: 'Cotton Candy', bg: 'linear-gradient(135deg, #ff9a9e, #fecfef)' },
];

export default function ThemeSwitcher({ currentTheme, onSelectTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`theme-switcher-container ${isOpen ? 'active' : ''}`}
    >
      <button
        className="theme-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Theme Menu"
      >
        <i className="fa-solid fa-palette"></i>
      </button>
      
      <div className="theme-menu">
        <h4>Select Background Theme</h4>
        <div className="theme-options">
          {themeOptionsList.map((theme) => (
            <button
              key={theme.key}
              className={`theme-opt ${currentTheme === theme.key ? 'active' : ''}`}
              style={{ background: theme.bg }}
              title={theme.title}
              onClick={() => {
                onSelectTheme(theme.key);
                setIsOpen(false);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
