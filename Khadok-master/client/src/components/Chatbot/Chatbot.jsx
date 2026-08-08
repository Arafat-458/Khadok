import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCart } from 'react-use-cart';
import { useNavigate } from 'react-router-dom';
import { buildAssistantReply, extractOrderProduct } from './chatbotLogic';
import { loadProducts, loadProductsSync } from '../Products/productCatalog';
import auth from '../firebase.init';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'হ্যালো! আমি স্বাস্থ্যভিত্তিক খাবার, বাজেট অনুযায়ী সাজেশন, অর্ডার ট্র্যাকিং আর প্রাইস আপডেটে সহায়তা করতে পারি।'
    }
  ]);
  const [input, setInput] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [pendingPlatter, setPendingPlatter] = useState(null);
  const [user] = useAuthState(auth);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const isAdmin = Boolean(user?.email) && /admin/i.test(user.email);

  useEffect(() => {
    const syncCatalog = async () => {
      const cachedProducts = loadProductsSync();
      if (cachedProducts.length > 0) setCatalog(cachedProducts);

      loadProducts()
        .then((products) => {
          setCatalog(products);
          setCatalogLoading(false);
        })
        .catch((error) => {
          console.error('Failed to refresh chatbot catalog', error);
          setCatalogLoading(false);
        });
    };

    syncCatalog();

    const onCatalogUpdate = () => {
      setCatalog(loadProductsSync());
    };

    window.addEventListener('foodie:catalog-updated', onCatalogUpdate);
    return () => window.removeEventListener('foodie:catalog-updated', onCatalogUpdate);
  }, []);

  const confirmPlatter = () => {
    if (!pendingPlatter) return;
    pendingPlatter.items.forEach((item) => addItem(item));
    setMessages((current) => [
      ...current,
      { id: Date.now(), sender: 'bot', text: `${pendingPlatter.title} confirmed হয়েছে। ${pendingPlatter.items.map((item) => item.title).join(', ')} checkout page-এ দেখানো হচ্ছে।` }
    ]);
    setPendingPlatter(null);
    setTimeout(() => navigate('/placeOrder'), 500);
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    if (catalogLoading || catalog.length === 0) {
      setMessages((current) => [
        ...current,
        { id: Date.now(), sender: 'user', text: trimmed },
        { id: Date.now() + 1, sender: 'bot', text: 'Menu এখনও load হচ্ছে। কয়েক সেকেন্ড পরে আবার চেষ্টা করুন।' }
      ]);
      setInput('');
      return;
    }

    const isPlatterConfirmation = /\b(confirm|confirmed|yes|okay|ok|নিশ্চিত|কনফার্ম)\b/i.test(trimmed) && Boolean(pendingPlatter);
    if (isPlatterConfirmation) {
      setMessages((current) => [
        ...current,
        { id: Date.now(), sender: 'user', text: trimmed }
      ]);
      setInput('');
      confirmPlatter();
      return;
    }

    const requestedProduct = extractOrderProduct(trimmed, catalog);
    let queueInfo = null;

    if (requestedProduct) {
      try {
        const response = await fetch(`${API_BASE_URL}/orders`);
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const payload = await response.json();
        const orders = Array.isArray(payload) ? payload : payload.orders || [];
        const queueCount = orders.filter((order) => {
          const status = String(order.status || order.orderStatus || 'Pending').toLowerCase();
          if (!['pending', 'confirmed'].includes(status)) return false;
          return (order.orderItems || []).some((item) => (
            String(item.id ?? item.productId) === String(requestedProduct.id)
              || String(item.title || '').toLowerCase() === String(requestedProduct.title).toLowerCase()
          ));
        }).length;
        queueInfo = { product: requestedProduct, queueCount };
      } catch (error) {
        console.error('Unable to load product queue', error);
      }
    }

    const result = buildAssistantReply(catalog, trimmed, isAdmin, queueInfo);
    if (result.updatedCatalog) {
      setCatalog(result.updatedCatalog);
    }

    const nextMessages = [
      ...messages,
      { id: Date.now(), sender: 'user', text: trimmed },
      { id: Date.now() + 1, sender: 'bot', text: result.reply }
    ];

    setMessages(nextMessages);
    setInput('');

    if (queueInfo?.product) setCheckoutProduct(queueInfo.product);
    if (result.packageSuggestion) setPendingPlatter(result.packageSuggestion);

  };

  const startCheckout = () => {
    if (!checkoutProduct) return;
    addItem(checkoutProduct);
    navigate('/placeOrder');
  };

  return (
    <section className="mx-auto my-10 max-w-5xl rounded-2xl border border-base-300 bg-base-200/70 p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Foodie Assistant</h2>
          <p className="text-sm text-gray-300">স্বাস্থ্যভিত্তিক সাজেশন, বাজেটভিত্তিক খাবার আর অর্ডার আপডেট.</p>
        </div>
      </div>

      <div className="mb-4 flex h-80 flex-col gap-3 overflow-y-auto rounded-xl bg-base-100/70 p-4">
        {messages.map((message) => (
          <div key={message.id} className={`max-w-[80%] rounded-xl px-4 py-3 ${message.sender === 'bot' ? 'bg-primary/20 text-white' : 'ml-auto bg-accent/20 text-white'}`}>
            {message.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex flex-col gap-3 md:flex-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="flex-1 rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-white outline-none"
          placeholder="যেমন: diabetes-friendly food, budget 20, বা change price of Pizza to 12"
        />
        <button type="submit" disabled={catalogLoading} className="rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {catalogLoading ? 'Loading menu...' : 'Send'}
        </button>
      </form>
      {checkoutProduct && (
        <button onClick={startCheckout} className="mt-4 rounded-xl bg-secondary px-4 py-3 font-semibold text-white">
          Add {checkoutProduct.title} to cart &amp; checkout
        </button>
      )}
      {pendingPlatter && (
        <div className="mt-4 rounded-xl border border-secondary/50 bg-secondary/10 p-4 text-white">
          <p className="font-semibold">{pendingPlatter.title} — ৳{pendingPlatter.total} / ৳{pendingPlatter.budget}</p>
          <p className="mt-1 text-sm text-gray-200">{pendingPlatter.items.map((item) => item.title).join(' + ')}</p>
          <button onClick={confirmPlatter} className="mt-3 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-white">
            Confirm platter &amp; checkout
          </button>
        </div>
      )}
    </section>
  );
};

export default Chatbot;
