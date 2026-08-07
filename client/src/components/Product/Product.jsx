import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from 'react-use-cart';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Product = ({ product }) => {
  const { img, price, title, id } = product;
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [fetchedReviewSummary, setFetchedReviewSummary] = useState(null);
  const reviewSummary = product.reviewSummary || fetchedReviewSummary;

  useEffect(() => {
    // The product grid loads review summaries in one batch. Only request an
    // individual summary when this card is rendered outside that grid.
    if (product.reviewSummary) return undefined;
    let active = true;
    fetch(`${API_BASE_URL}/reviews/product/${encodeURIComponent(id)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => active && data && setFetchedReviewSummary(data))
      .catch((error) => console.error('Unable to load product reviews', error));
    return () => { active = false; };
  }, [id, product.reviewSummary]);

  const rating = Number(reviewSummary?.averageRating || 0);
  const totalReviewCount = Number(reviewSummary?.reviewCount || 0);
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <section>
      <div className="card w-96 bg-base-100 shadow-xl">
        <figure><img src={img} alt={title} className="h-72 w-full object-cover" /></figure>
        <div className="card-body">
          <h2 className="text-center text-3xl font-bold text-white">{title}</h2>
          <p className="text-xl font-medium">{product.priceApproved === false ? 'Price unavailable' : `Price: ৳${price}`}</p>
          <div className="my-3 flex items-center gap-2 text-yellow-400">
            {[...Array(fullStars)].map((_, index) => <span key={`full-${index}`} className="text-xl">&#9733;</span>)}
            {hasHalfStar && <span className="text-xl">&#9734;</span>}
            {[...Array(emptyStars)].map((_, index) => <span key={`empty-${index}`} className="text-xl text-gray-400">&#9733;</span>)}
            <span className="text-lg font-semibold text-white">({rating || 'N/A'})</span>
          </div>
          <p className="text-sm text-gray-400">Rated by {totalReviewCount} customers</p>
          <div className="card-actions mt-5 flex items-center justify-center">
            <button onClick={() => addItem(product)} className="btn btn-primary">Add to cart</button>
            <button onClick={() => navigate(`/products/${id}`)} className="btn btn-primary">View Details</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Product;
