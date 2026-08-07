import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import Product from '../Product/Product';
import { loadProducts } from './productCatalog';
import { db } from '../firebase.init';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);

  useEffect(() => {
    const syncProducts = async () => {
      const [data, summariesResponse] = await Promise.all([
        loadProducts(),
        fetch(`${API_BASE_URL}/reviews/summaries`).catch(() => null)
      ]);
      const summaries = summariesResponse?.ok ? await summariesResponse.json() : [];
      const summariesByProduct = new Map(summaries.map((summary) => [String(summary.productId), summary]));
      setProducts(data);
      setPopularProducts(data
        .filter((product) => summariesByProduct.has(String(product.id)))
        .map((product) => ({ ...product, ...summariesByProduct.get(String(product.id)) }))
        .sort((first, second) => second.averageRating - first.averageRating || second.reviewCount - first.reviewCount)
        .slice(0, 3));
    };

    syncProducts();

    const onCatalogUpdate = () => { syncProducts(); };

    window.addEventListener('foodie:catalog-updated', onCatalogUpdate);
    window.addEventListener('foodie:reviews-updated', onCatalogUpdate);
    const unsubscribe = onSnapshot(collection(db, 'products'), () => {
      syncProducts();
    }, (error) => console.warn('Unable to subscribe to product updates', error));

    return () => {
      window.removeEventListener('foodie:catalog-updated', onCatalogUpdate);
      window.removeEventListener('foodie:reviews-updated', onCatalogUpdate);
      unsubscribe();
    };
  }, []);

  return (
    <section className="px-12">
      <div className="mt-20">
        <h1 className="text-center text-4xl font-semibold">Our Products</h1>

        {popularProducts.length > 0 && (
          <div className="my-8 rounded-2xl border border-primary/40 bg-base-200/70 p-6">
            <h2 className="mb-4 text-2xl font-semibold text-white">Popular Picks</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {popularProducts.map((product) => (
                <div key={product.id} className="rounded-xl bg-base-100 p-4 text-white shadow-lg">
                  <img src={product.img} alt={product.title} className="mb-3 h-40 w-full rounded-lg object-cover" />
                  <p className="font-semibold">{product.title}</p>
                  <p className="text-sm text-yellow-400">&#9733; {product.averageRating} ({product.reviewCount} reviews)</p>
                  <p className="text-sm text-primary">{product.priceApproved === false ? 'Price unavailable' : `৳${product.price}`}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="my-10 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => <Product key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
};

export default Products;
