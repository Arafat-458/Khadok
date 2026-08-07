import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import auth from '../firebase.init';

const Contact = () => {
  const [user] = useAuthState(auth);
  const [formData, setFormData] = useState({
    name: '',
    email: '1234@gmail.com',
    phone: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Message sent successfully! We will get back to you soon.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-20">
        <div className="container mx-auto px-12 text-center">
          <h1 className="text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl">We'd love to hear from you. Send us a message!</p>
        </div>
      </div>

      <div className="container mx-auto px-12 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Contact Info Cards */}
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <i className="fas fa-phone text-5xl text-orange-500 mb-4"></i>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Phone</h3>
            <p className="text-gray-600 mb-2">+880 1878999794</p>
            <p className="text-gray-500 text-sm">Available Mon-Fri, 9AM-10PM</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <i className="fas fa-envelope text-5xl text-orange-500 mb-4"></i>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Email</h3>
            <p className="text-gray-600 mb-2">turjochy16@gmail.com</p>
            <p className="text-gray-500 text-sm">Response within 24 hours</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <i className="fas fa-map-marker-alt text-5xl text-orange-500 mb-4"></i>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Address</h3>
            <p className="text-gray-600 mb-2">New Market, Chittagong</p>
            <p className="text-gray-500 text-sm">Bangladesh</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="grid md:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-black p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="Your full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                    placeholder="+880 1700-000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="What is this about?"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="Your message here..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading || !user}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
              {!user && <p className="text-center text-sm text-gray-300">Please <Link to="/login" className="text-primary underline">log in</Link> to send a message.</p>}
            </form>
          </div>

          {/* Map/Info */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Get in Touch</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-orange-500 mb-3 flex items-center gap-2">
                  <i className="fas fa-clock"></i>
                  Business Hours
                </h3>
                <p className="text-gray-600 mb-2"><strong>Monday - Friday:</strong> 9:00 AM - 10:00 PM</p>
                <p className="text-gray-600 mb-2"><strong>Saturday:</strong> 10:00 AM - 11:00 PM</p>
                <p className="text-gray-600"><strong>Sunday:</strong> 10:00 AM - 10:00 PM</p>
              </div>

              <hr />

              <div>
                <h3 className="text-xl font-bold text-orange-500 mb-3 flex items-center gap-2">
                  <i className="fas fa-question-circle"></i>
                  Quick Help
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <i className="fas fa-check text-orange-500"></i>
                    Order tracking & updates
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-check text-orange-500"></i>
                    Delivery & refund issues
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-check text-orange-500"></i>
                    Account & payment help
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fas fa-check text-orange-500"></i>
                    Restaurant inquiries
                  </li>
                </ul>
              </div>

              <hr />

              <div>
                <h3 className="text-xl font-bold text-orange-500 mb-3 flex items-center gap-2">
                  <i className="fas fa-share-alt"></i>
                  Follow Us
                </h3>
                <div className="flex gap-4">
                  <a href="#" className="text-gray-600 hover:text-orange-500 text-2xl">
                    <i className="fab fa-facebook"></i>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-orange-500 text-2xl">
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-orange-500 text-2xl">
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-orange-500 text-2xl">
                    <i className="fab fa-linkedin"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
