import React, { useEffect, useMemo, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import auth from '../firebase.init';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const MyOrders = () => {
  const [user, authLoading] = useAuthState(auth);
  const [orders, setOrders] = useState([]);
  const [reviewsByProduct, setReviewsByProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!user?.email || !user?.uid) return;
    setLoading(true);
    try {
      const [ordersResponse, reviewsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/orders/user/${encodeURIComponent(user.email)}`),
        fetch(`${API_BASE_URL}/reviews/user/${encodeURIComponent(user.uid)}`)
      ]);
      if (!ordersResponse.ok || !reviewsResponse.ok) throw new Error('Unable to load your orders.');
      const [orderRows, reviewRows] = await Promise.all([ordersResponse.json(), reviewsResponse.json()]);
      setOrders(Array.isArray(orderRows) ? orderRows : []);
      setReviewsByProduct((Array.isArray(reviewRows) ? reviewRows : []).reduce((all, item) => {
        all[item.productId] = item;
        return all;
      }, {}));
      setError('');
    } catch (requestError) {
      console.error('Unable to load My Orders', requestError);
      setError('Your orders could not be loaded right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user?.uid, user?.email]);

  const deliveredProducts = useMemo(() => {
    const uniqueProducts = new Map();
    orders.forEach((order) => {
      const status = String(order.status || order.orderStatus || '').toLowerCase();
      if (status !== 'delivered') return;
      (order.orderItems || []).forEach((item) => {
        const productId = String(item.id ?? item.productId ?? '');
        if (productId && !uniqueProducts.has(productId)) uniqueProducts.set(productId, { ...item, productId, orderId: order._id });
      });
    });
    return Array.from(uniqueProducts.values());
  }, [orders]);

  const openReview = (product) => {
    const existing = reviewsByProduct[product.productId];
    setSelectedProduct(product);
    setRating(existing?.rating || 0);
    setReviewText(existing?.review || '');
    setError('');
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!selectedProduct || !rating) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.productId,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || user.email.split('@')[0],
          rating,
          review: reviewText
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Review could not be saved.');
      setReviewsByProduct((current) => ({ ...current, [selectedProduct.productId]: payload.review }));
      window.dispatchEvent(new Event('foodie:reviews-updated'));
      setSelectedProduct(null);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="p-10 text-white">Loading your orders...</div>;

  return (
    <section className="mx-auto min-h-screen max-w-5xl p-6 text-white">
      <h1 className="text-3xl font-semibold">My Orders</h1>
      <p className="mt-2 text-gray-300">Rate products after your order has been delivered.</p>
      {error && <p className="mt-4 rounded-lg bg-error/20 p-3 text-error">{error}</p>}

      {deliveredProducts.length === 0 ? (
        <p className="mt-8 rounded-xl border border-base-300 bg-base-200/70 p-5 text-gray-300">No delivered products are available for review yet.</p>
      ) : (
        <div className="mt-6 grid gap-4">
          {deliveredProducts.map((product) => {
            const existing = reviewsByProduct[product.productId];
            return (
              <div key={product.productId} className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <img src={product.img || '/img/Pizza.jpg'} alt={product.title} className="h-16 w-16 rounded-xl object-cover" />
                  <div>
                    <h2 className="font-semibold">{product.title || 'Product'}</h2>
                    <p className="text-sm text-success">Delivered</p>
                    {existing && <p className="text-sm text-gray-300">Your rating: {existing.rating}/5</p>}
                  </div>
                </div>
                <button onClick={() => openReview(product)} className="btn btn-primary">
                  {existing ? 'Edit Review' : 'Rate & Review'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedProduct && (
        <form onSubmit={submitReview} className="mt-8 rounded-2xl border border-primary/50 bg-base-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Rate {selectedProduct.title}</h2>
            <button type="button" onClick={() => setSelectedProduct(null)} className="btn btn-ghost btn-sm">Cancel</button>
          </div>
          <div className="mt-4 flex gap-2" aria-label="Product rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)} className={`text-3xl ${star <= rating ? 'text-yellow-400' : 'text-gray-500'}`} aria-label={`${star} stars`}>
                &#9733;
              </button>
            ))}
          </div>
          <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder="Write an optional review" className="mt-4 min-h-28 w-full rounded-lg border border-base-300 bg-base-100 p-3" />
          <button type="submit" disabled={!rating || saving} className="btn btn-primary mt-4">{saving ? 'Saving...' : 'Submit Review'}</button>
        </form>
      )}
    </section>
  );
};

export default MyOrders;
