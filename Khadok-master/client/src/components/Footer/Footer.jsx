import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-20 bg-gray-950 py-12 text-white">
      <div className="container mx-auto grid gap-8 px-6 md:grid-cols-3">
        <div>
          <h3 className="text-xl font-semibold">Foodie</h3>
          <p className="mt-3 text-sm text-gray-400">Healthy meals, budget-friendly picks, and fast delivery support in one experience.</p>
        </div>
        <div>
          <h4 className="font-semibold">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-400">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/products" className="hover:text-primary">Products</Link></li>
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Follow Us</h4>
          <div className="mt-3 flex gap-3 text-xl text-gray-400">
            <a href="#" aria-label="Facebook" className="hover:text-primary">📘</a>
            <a href="#" aria-label="Instagram" className="hover:text-primary">📸</a>
            <a href="#" aria-label="X" className="hover:text-primary">𝕏</a>
          </div>
          <p className="mt-4 text-sm text-gray-500">© 2026 Foodie. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
