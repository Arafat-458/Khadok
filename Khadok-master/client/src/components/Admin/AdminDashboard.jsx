import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import auth, { db } from '../firebase.init';
import { loadProducts, saveProducts } from '../Products/productCatalog';
import { checkAdminAccess } from '../Authentication/adminAccess';

const emptyProduct = {
  title: '',
  desc: '',
  price: 0,
  review: 0,
  ratingCount: 0,
  img: '/img/Pizza.jpg',
  marketRange: '8-12',
  healthTags: ['diabetes']
};

const regionRules = {
  Dhaka: { label: 'Dhaka', minMultiplier: 0.95, maxMultiplier: 1.05 },
  Chattogram: { label: 'Chattogram', minMultiplier: 0.92, maxMultiplier: 1.08 },
  Other: { label: 'Other regions', minMultiplier: 0.9, maxMultiplier: 1.1 }
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const normalizeOrderStatus = (order) => String(order.status || order.orderStatus || 'Pending').toLowerCase();

const getMarketBounds = (product, region) => {
  const [minText, maxText] = String(product.marketRange || '').split('-');
  const baseMin = Number(minText) || Math.max(0, Number(product.price) * 0.9);
  const baseMax = Number(maxText) || Number(product.price) * 1.1;
  const rule = regionRules[region];
  return { min: baseMin * rule.minMultiplier, max: baseMax * rule.maxMultiplier };
};

const AdminDashboard = () => {
  const [user, loading] = useAuthState(auth);
  const [products, setProducts] = useState([]);
  const [access, setAccess] = useState({ uid: null, allowed: false, loading: true });
  const [priceAccess, setPriceAccess] = useState({ uid: null, allowed: false, loading: true });
  const [selectedRegion, setSelectedRegion] = useState('Dhaka');
  const [priceDrafts, setPriceDrafts] = useState({});
  const [imageDrafts, setImageDrafts] = useState({});
  const [saveError, setSaveError] = useState('');
  const [draft, setDraft] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.resolve(user ? checkAdminAccess(user) : false)
      .then((allowed) => active && setAccess({ uid: user?.uid ?? null, allowed, loading: false }))
      .catch((error) => {
        console.error('Unable to verify admin access', error);
        if (active) setAccess({ uid: user?.uid ?? null, allowed: false, loading: false });
      })

    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    let active = true;
    Promise.resolve(user ? checkAdminAccess(user, true) : false)
      .then((allowed) => active && setPriceAccess({ uid: user?.uid ?? null, allowed, loading: false }))
      .catch(() => active && setPriceAccess({ uid: user?.uid ?? null, allowed: false, loading: false }));
    return () => { active = false; };
  }, [user]);

  const accessLoading = Boolean(user) && (access.uid !== user.uid || access.loading);
  const isAdmin = Boolean(user) && access.uid === user.uid && access.allowed;
  const canManagePrices = Boolean(user) && priceAccess.uid === user.uid && priceAccess.allowed;

  useEffect(() => {
    loadProducts().then(setProducts);

    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const rows = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));

      if (rows.length) {
        setProducts((current) => {
          const merged = new Map(current.map((product) => [String(product.id), product]));
          rows.forEach((product) => merged.set(String(product.id), { ...merged.get(String(product.id)), ...product }));
          const nextProducts = Array.from(merged.values());
          saveProducts(nextProducts);
          return nextProducts;
        });
      }
    }, (error) => console.error('Unable to load Firestore products', error));

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const controller = new AbortController();

    const loadOrders = async () => {
      setOrdersLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/orders`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const payload = await response.json();
        const rows = Array.isArray(payload) ? payload : payload.orders || [];
        setOrders(rows.map((order) => ({
          id: order._id || order.id,
          customer: order.userInfo?.name || order.customer || order.name || 'Customer',
          total: Number(order.cartTotal ?? order.total ?? 0),
          status: normalizeOrderStatus(order),
          createdAt: order.orderDate || order.createdAt
        })));
        setOrdersError('');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Unable to load orders', error);
          setOrdersError('Could not load orders from MongoDB. Make sure the API server is running.');
        }
      } finally {
        if (!controller.signal.aborted) setOrdersLoading(false);
      }
    };

    loadOrders();
    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const controller = new AbortController();

    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/reviews`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const payload = await response.json();
        const rows = Array.isArray(payload) ? payload : payload.reviews || [];
        setReviews(rows.map((review) => ({
          id: review._id || review.id,
          customer: review.userInfo?.name || review.customer || review.name || review.userName || 'Customer',
          text: review.text || review.comment || review.review || '',
          rating: Number(review.rating ?? review.stars ?? 0)
        })));
        setReviewsError('');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Unable to load reviews', error);
          setReviewsError('Could not load reviews from MongoDB. Make sure the API server is running.');
        }
      } finally {
        if (!controller.signal.aborted) setReviewsLoading(false);
      }
    };

    loadReviews();
    return () => controller.abort();
  }, [user]);

  const updateProduct = async (productId, changes) => {
    setProducts((current) => {
      const nextProducts = current.map((product) => (
        String(product.id) === String(productId) ? { ...product, ...changes } : product
      ));
      saveProducts(nextProducts);
      return nextProducts;
    });

    try {
      // Merge prevents a price update for one product from overwriting another
      // product's data when several edits are saved in quick succession.
      await setDoc(doc(db, 'products', String(productId)), changes, { merge: true });
      setSaveError('');
    } catch (error) {
      console.error('Unable to update product', error);
      setSaveError('Product change could not be saved. Check Firestore rules and your admin role.');
    }
  };

  const handlePriceChange = (product, value) => {
    if (!canManagePrices) {
      setSaveError('Only verified admin accounts can change prices.');
      return;
    }

    const price = Math.max(0, Number(value) || 0);
    const { min, max } = getMarketBounds(product, selectedRegion);
    if (price < min || price > max) {
      updateProduct(product.id, { priceApproved: false }).then(() => {
        setSaveError(`Price was not published. ${product.title} must be between ৳${min.toFixed(0)} and ৳${max.toFixed(0)} for ${selectedRegion}.`);
      });
      return;
    }

    const regionalPrices = { ...(product.regionalPrices || {}), [selectedRegion]: price };
    updateProduct(product.id, { price, regionalPrices, priceApproved: true }).then(() => {
      setPriceDrafts((current) => {
        const next = { ...current };
        delete next[product.id];
        return next;
      });
    });
  };

  const handleAddProduct = async () => {
    const id = editingId || `product-${Date.now()}`;
    const newItem = {
      ...draft,
      id,
      price: Number(draft.price) || 0,
      review: Number(draft.review) || 4.2,
      ratingCount: Number(draft.ratingCount) || 10
    };

    const nextProducts = editingId
      ? products.map((product) => (String(product.id) === String(editingId) ? newItem : product))
      : [newItem, ...products];

    setProducts(nextProducts);
    saveProducts(nextProducts);
    try {
      await setDoc(doc(db, 'products', id), newItem);
      setSaveError('');
      setDraft(emptyProduct);
      setEditingId(null);
    } catch (error) {
      console.error('Unable to save product', error);
      setSaveError('Product could not be saved. Check Firestore rules and your admin role.');
    }
  };

  const handleDelete = async (productId) => {
    const nextProducts = products.filter((product) => String(product.id) !== String(productId));
    setProducts(nextProducts);
    saveProducts(nextProducts);
    try {
      await deleteDoc(doc(db, 'products', String(productId)));
      setSaveError('');
    } catch (error) {
      console.error('Unable to delete product', error);
      setSaveError('Product could not be deleted. Check Firestore rules and your admin role.');
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setDraft({
      ...emptyProduct,
      ...product,
      price: product.price,
      review: product.review,
      ratingCount: product.ratingCount
    });
  };

  const getPriceWarning = (product, value) => {
    const price = Number(value);
    if (!Number.isFinite(price)) return '';
    const { min, max } = getMarketBounds(product, selectedRegion);
    if (price > max) return `Warning: this is above the ${selectedRegion} market range (৳${min.toFixed(0)}–৳${max.toFixed(0)}).`;
    if (price < min) return `Warning: this is below the ${selectedRegion} market range (৳${min.toFixed(0)}–৳${max.toFixed(0)}).`;
    return `Within the ${selectedRegion} market range (৳${min.toFixed(0)}–৳${max.toFixed(0)}).`;
  };

  const deleteReview = async (id) => {
    const previousReviews = reviews;
    setReviews((current) => current.filter((review) => review.id !== id));
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Review delete failed');
    } catch (error) {
      console.error('Unable to delete review', error);
      setReviews(previousReviews);
      setReviewsError('Review could not be deleted from MongoDB.');
    }
  };

  const updateOrderStatus = async (id, status) => {
    const previousOrders = orders;
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Status update failed');
    } catch (error) {
      console.error('Unable to update order status', error);
      setOrders(previousOrders);
      setOrdersError('Order status could not be updated.');
    }
  };

  if (loading || accessLoading) {
    return <div className="p-10 text-white">Loading admin panel...</div>;
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-4xl p-10 text-white">
        <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
        <p className="mt-3">Please sign in to manage products.</p>
        <Link to="/login" className="btn btn-primary mt-5">Go to Login</Link>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-4xl p-10 text-white">
        <h1 className="text-3xl font-semibold">Access Restricted</h1>
          <p className="mt-3">Please sign in again to open the dashboard.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl p-8 text-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="mt-2 text-gray-300">Manage products, prices, orders, reviews, and profile from one place.</p>
          {!canManagePrices && !priceAccess.loading && <p className="mt-2 text-sm text-warning">Price changes are locked until this account has the Firebase admin role.</p>}
        </div>
        <button onClick={() => signOut(auth)} className="btn btn-outline btn-error">Logout</button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total Products', value: products.length },
          { label: 'Active Orders', value: orders.filter((order) => order.status !== 'delivered').length },
          { label: 'Total Reviews', value: reviews.length }
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-base-300 bg-base-200/70 p-4">
            <p className="text-sm text-gray-400">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-base-300 bg-base-200/70 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          {editingId && <button onClick={() => { setEditingId(null); setDraft(emptyProduct); }} className="btn btn-ghost btn-sm">Cancel</button>}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Product name" className="rounded border border-base-300 bg-base-100 px-3 py-2" />
          <input value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} type="number" placeholder="Price" className="rounded border border-base-300 bg-base-100 px-3 py-2" />
          <input value={draft.review} onChange={(event) => setDraft({ ...draft, review: event.target.value })} type="number" placeholder="Rating" className="rounded border border-base-300 bg-base-100 px-3 py-2" />
          <input value={draft.img} onChange={(event) => setDraft({ ...draft, img: event.target.value })} placeholder="Image path" className="rounded border border-base-300 bg-base-100 px-3 py-2" />
        </div>
        <textarea value={draft.desc} onChange={(event) => setDraft({ ...draft, desc: event.target.value })} placeholder="Product description" className="mt-3 min-h-20 w-full rounded border border-base-300 bg-base-100 px-3 py-2" />
        <button onClick={handleAddProduct} className="btn btn-primary mt-4">{editingId ? 'Save Changes' : 'Add Product'}</button>
        {saveError && <p className="mt-3 text-sm text-error">{saveError}</p>}
      </div>

      <div className="mt-8">
        <div className="rounded-2xl border border-base-300 bg-base-200/70 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Manage Products</h2>
            <label className="flex items-center gap-2 text-sm">Price region
              <select value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)} className="rounded border border-base-300 bg-base-100 px-3 py-2">
                {Object.keys(regionRules).map((region) => <option key={region}>{region}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-4 grid gap-4">
            {products.map((product) => (
              <div key={product.id} className="rounded-2xl border border-base-300 bg-base-100/70 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <img
                      src={imageDrafts[product.id] ?? product.img ?? '/img/Pizza.jpg'}
                      alt={product.title}
                      className="float-left mr-4 h-20 w-20 rounded-xl object-cover"
                      onError={(event) => { event.currentTarget.src = '/img/Pizza.jpg'; }}
                    />
                    <h3 className="text-lg font-semibold">{product.title}</h3>
                    <p className="text-sm text-gray-400">Current price: ৳{product.regionalPrices?.[selectedRegion] ?? product.price}</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={priceDrafts[product.id] ?? product.regionalPrices?.[selectedRegion] ?? product.price}
                      disabled={!canManagePrices}
                      onChange={(event) => setPriceDrafts((current) => ({ ...current, [product.id]: event.target.value }))}
                      aria-label={`${selectedRegion} price for ${product.title}`}
                      className="w-28 rounded border border-base-300 bg-base-100 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <button
                      onClick={() => handlePriceChange(product, priceDrafts[product.id] ?? product.regionalPrices?.[selectedRegion] ?? product.price)}
                      disabled={!canManagePrices}
                      className="btn btn-sm btn-primary disabled:cursor-not-allowed"
                    >
                      Save price
                    </button>
                    <button onClick={() => startEdit(product)} className="btn btn-sm btn-accent">Edit</button>
                    <button onClick={() => handleDelete(product.id)} className="btn btn-sm btn-error">Delete</button>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="url"
                    value={imageDrafts[product.id] ?? product.img ?? ''}
                    onChange={(event) => setImageDrafts((current) => ({ ...current, [product.id]: event.target.value }))}
                    placeholder="Product image URL"
                    aria-label={`Image URL for ${product.title}`}
                    className="min-w-0 flex-1 rounded border border-base-300 bg-base-100 px-3 py-2"
                  />
                  <button
                    onClick={() => updateProduct(product.id, { img: imageDrafts[product.id] ?? product.img ?? '' }).then(() => {
                      setImageDrafts((current) => {
                        const next = { ...current };
                        delete next[product.id];
                        return next;
                      });
                    })}
                    className="btn btn-sm btn-secondary"
                  >
                    Save image
                  </button>
                </div>
                <p className={`mt-2 text-xs ${getPriceWarning(product, priceDrafts[product.id] ?? product.regionalPrices?.[selectedRegion] ?? product.price).startsWith('Warning') ? 'text-warning' : 'text-success'}`}>
                  {getPriceWarning(product, priceDrafts[product.id] ?? product.regionalPrices?.[selectedRegion] ?? product.price)}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-base-300 bg-base-200/70 p-6">
          <h2 className="text-xl font-semibold">Manage Orders</h2>
          {ordersLoading && <p className="mt-4 text-sm text-gray-400">Loading orders from MongoDB...</p>}
          {ordersError && <p className="mt-4 text-sm text-error">{ordersError}</p>}
          {!ordersLoading && !ordersError && orders.length === 0 && <p className="mt-4 text-sm text-gray-400">No customer orders yet.</p>}
          <div className="mt-4 grid gap-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-base-300 bg-base-100/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{order.customer}</p>
                    <p className="text-sm text-gray-400">৳{order.total}</p>
                    {order.createdAt && <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>}
                  </div>
                  <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)} className="rounded border border-base-300 bg-base-100 px-2 py-2">
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-200/70 p-6">
          <h2 className="text-xl font-semibold">Manage Reviews</h2>
          {reviewsLoading && <p className="mt-4 text-sm text-gray-400">Loading reviews from MongoDB...</p>}
          {reviewsError && <p className="mt-4 text-sm text-error">{reviewsError}</p>}
          {!reviewsLoading && !reviewsError && reviews.length === 0 && <p className="mt-4 text-sm text-gray-400">No customer reviews yet.</p>}
          <div className="mt-4 grid gap-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-base-300 bg-base-100/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{review.customer}</p>
                    <p className="text-sm text-gray-400">{review.text}</p>
                  </div>
                  <button onClick={() => deleteReview(review.id)} className="btn btn-sm btn-error">Delete</button>
                </div>
                <p className="mt-2 text-sm text-yellow-400">Rating: {review.rating}/5</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-base-300 bg-base-200/70 p-6">
        <h2 className="text-xl font-semibold">Admin Profile</h2>
        <p className="mt-3 text-gray-300">Signed in as {user?.email}</p>
        <p className="mt-2 text-sm text-gray-400">You can update your profile or password from this workspace when needed.</p>
      </div>
    </section>
  );
};

export default AdminDashboard;
