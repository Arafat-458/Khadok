import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from 'react-use-cart';
import { getPriceRangeStatus, loadProducts } from '../Products/productCatalog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ProductDetails = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState({ reviews: [], averageRating: 0, reviewCount: 0 });
  const navigate = useNavigate();
  const { addItem } = useCart();

  useEffect(() => {
    const syncProduct = async () => {
      setLoading(true);
      try {
        const [data, reviewResponse] = await Promise.all([
          loadProducts(),
          fetch(`${API_BASE_URL}/reviews/product/${encodeURIComponent(productId)}`)
        ]);
        const foundProduct = data.find((item) => String(item.id) === String(productId));
        setProduct(foundProduct || null);
        if (reviewResponse.ok) setReviewData(await reviewResponse.json());
      } catch (err) {
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    };

    syncProduct();
  }, [productId]);

  const handlePlaceOrder = () => {
    navigate('/placeOrder');
  };

  const priceStatus = product ? getPriceRangeStatus(product) : null;

  return (
    <section>
      <div className="flex flex-col justify-evenly px-12 py-12 lg:flex-row">
        <div className="w-full lg:w-1/2">
          <div className="card card-compact w-full max-w-xl bg-base-100 shadow-xl">
            <figure className="flex min-h-80 items-center justify-center bg-gray-200">
              {loading ? (
                <span className="loading loading-spinner loading-lg"></span>
              ) : product?.img ? (
                <img 
                  src={product.img} 
                  alt={product.title} 
                  className="w-full h-80 object-cover"
                  onError={(e) => {
                    console.error("Image failed to load:", product.img);
                    e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
                  }}
                />
              ) : (
                <span className="text-gray-400">No image available</span>
              )}
            </figure>
            <div className="card-body">
              <div className="flex justify-evenly">
                <button
                  onClick={() => addItem(product)}
                  className="btn btn-primary"
                  disabled={!product || loading}
                >
                  Add To Cart
                </button>
                <button
                  onClick={() => {
                    handlePlaceOrder();
                    addItem(product);
                  }}
                  className="btn btn-primary"
                  disabled={!product || loading}
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 w-full lg:mt-0 lg:w-1/2">
          <div>
            <h1 className="text-3xl font-bold">{product?.title || 'Loading...'}</h1>
            <p className="mt-5 w-32 rounded-full bg-primary p-3 text-xl font-bold text-white shadow-2xl">
              Price: ${product?.price || '0'}
            </p>
            {priceStatus && (
              <p className={`mt-3 font-semibold ${priceStatus.status === 'overpriced' ? 'text-red-500' : 'text-green-600'}`}>
                {priceStatus.status === 'overpriced'
                  ? 'Warning: this item is above the usual market range.'
                  : priceStatus.status === 'budget-friendly'
                    ? 'This price is below the usual market range.'
                    : 'This price is within the usual market range.'}
              </p>
            )}
            <p className="text-orange-500 my-5 font-bold text-lg">
              Rating: {reviewData.averageRating || 0} ({reviewData.reviewCount || 0} reviews)
            </p>
            <p className="mt-5 max-w-xl text-justify font-bold text-gray-300">{product?.desc || 'Loading...'}</p>
          </div>
          <div className="mt-10 max-w-xl rounded-2xl border border-base-300 bg-base-200/70 p-6">
            <h2 className="text-2xl font-semibold">Customer Reviews</h2>
            <p className="mt-2 text-yellow-400">Average: {reviewData.averageRating || 0}/5 from {reviewData.reviewCount || 0} reviews</p>
            {reviewData.reviews.length === 0 ? (
              <p className="mt-4 text-sm text-gray-300">No customer reviews yet.</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {reviewData.reviews.map((item) => (
                  <article key={item._id} className="rounded-xl bg-base-100/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{item.userName || 'Customer'}</p>
                      <p className="text-yellow-400">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</p>
                    </div>
                    {item.review && <p className="mt-2 text-sm text-gray-300">{item.review}</p>}
                    <p className="mt-2 text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetails;
