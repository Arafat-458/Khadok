import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase.init';

const STORAGE_KEY = 'foodie-product-catalog';
let catalogRequest;
let bundledCatalogRequest;

const defaultMarketRange = {
  Pizza: '350-850', Burger: '180-600', Pasta: '220-550', Biriyani: '180-600',
  Sandwich: '150-380', Kebabs: '180-500', Cakes: '450-1600', 'Fast Food': '180-550',
  Chicken: '250-750', 'Vegetable Burger': '160-420', Lobster: '1200-3000',
  'Mushroom Pasta': '250-600', 'Seafood Platter': '900-2200', Mushroom: '180-400'
};

const defaultHealthTags = {
  Pizza: ['diabetes', 'cholesterol'],
  Burger: ['cholesterol'],
  Pasta: ['diabetes'],
  Biriyani: ['cholesterol'],
  Sandwich: ['diabetes'],
  Kebabs: ['diabetes', 'cholesterol'],
  Cakes: ['cholesterol'],
  'Fast Food': ['cholesterol'],
  Chicken: ['diabetes', 'cholesterol'],
  'Vegetable Burger': ['diabetes', 'cholesterol'],
  Lobster: ['diabetes'],
  'Mushroom Pasta': ['diabetes', 'cholesterol'],
  'Seafood Platter': ['diabetes'],
  Mushroom: ['diabetes', 'cholesterol']
};

function normalizeProduct(product) {
  const review = Number(product.averageRating ?? product.review ?? product.rating ?? 0) || 0;
  const ratingCount = Number(product.reviewCount ?? product.ratingCount ?? product.ratings ?? 0) || 0;
  const price = Number(product.price) || 0;
  const stock = Math.max(0, Number(product.stock ?? product.quantity ?? 0) || 0);

  return {
    ...product,
    price,
    stock,
    review: Number(review.toFixed(1)),
    ratingCount,
    popularityScore: Number((review * ratingCount).toFixed(1)),
    marketRange: product.marketRange || defaultMarketRange[product.title] || '5-15',
    healthTags: product.healthTags || defaultHealthTags[product.title] || ['diabetes', 'cholesterol']
  };
}

export function enrichProducts(products = []) {
  return products.map((product) => normalizeProduct(product));
}

function mergeProducts(remoteProducts, cachedProducts) {
  const merged = new Map();

  [...remoteProducts, ...cachedProducts].forEach((product) => {
    const key = String(product.id || product.title);
    const existing = merged.get(key) || {};
    merged.set(key, {
      ...existing,
      ...product,
      id: existing.id || product.id || key,
      title: existing.title || product.title || key,
      review: Number(product.averageRating ?? product.review ?? existing.review ?? 0),
      ratingCount: Number(product.reviewCount ?? product.ratingCount ?? existing.ratingCount ?? 0),
      price: Number(product.price ?? existing.price ?? 0),
      popularityScore: Number((Number(product.averageRating ?? product.review ?? existing.review ?? 0) * Number(product.reviewCount ?? product.ratingCount ?? existing.ratingCount ?? 0)).toFixed(1))
    });
  });

  return Array.from(merged.values());
}

export function saveProducts(products) {
  const normalized = enrichProducts(products);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('foodie:catalog-updated', { detail: normalized }));
  }
  return normalized;
}

export function loadProductsSync() {
  if (typeof window === 'undefined') {
    return [];
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    return enrichProducts(JSON.parse(stored));
  } catch (error) {
    console.error('Failed to parse cached products', error);
    return [];
  }
}

export async function loadProducts() {
  // Several home-page components use this catalog. Share the active request so
  // mounting them together does not start duplicate Firestore and JSON reads.
  if (catalogRequest) return catalogRequest;

  catalogRequest = (async () => {
  const cached = loadProductsSync();
  let baseProducts = cached;

  try {
    if (!bundledCatalogRequest) {
      bundledCatalogRequest = fetch('/fakeData.json')
        .then((response) => {
          if (!response.ok) throw new Error(`Could not load catalog (${response.status})`);
          return response.json();
        })
        .then(enrichProducts);
    }
    baseProducts = await bundledCatalogRequest;
  } catch (error) {
    console.error('Failed to load product catalog', error);
  }

  try {
    const snapshot = await getDocs(collection(db, 'products'));
    const firestoreProducts = enrichProducts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    return saveProducts(mergeProducts(baseProducts, firestoreProducts));
  } catch (error) {
    console.warn('Failed to load Firestore product catalog', error);
    return saveProducts(mergeProducts(baseProducts, cached));
  }
  })();

  try {
    return await catalogRequest;
  } finally {
    catalogRequest = null;
  }
}

export function updateProductPrice(productId, newPrice, currentProducts = loadProductsSync()) {
  const sourceProducts = currentProducts?.length ? currentProducts : loadProductsSync();
  const updatedProducts = sourceProducts.map((product) => {
    if (String(product.id) === String(productId)) {
      return { ...product, price: Number(newPrice) || 0 };
    }
    return product;
  });

  return saveProducts(updatedProducts);
}

export function rateProduct(productId, newRating) {
  const currentProducts = loadProductsSync();
  const updatedProducts = currentProducts.map((product) => {
    if (String(product.id) === String(productId)) {
      const previousReview = Number(product.review) || 0;
      const previousCount = Number(product.ratingCount) || 0;
      const nextCount = previousCount + 1;
      const nextReview = ((previousReview * previousCount) + Number(newRating)) / nextCount;

      return {
        ...product,
        review: Number(nextReview.toFixed(1)),
        ratingCount: nextCount,
        popularityScore: Number((nextReview * nextCount).toFixed(1))
      };
    }
    return product;
  });

  return saveProducts(updatedProducts);
}

export function getPopularProducts(products = []) {
  return [...products]
    .sort((first, second) => {
      if (Number(second.popularityScore || second.review) !== Number(first.popularityScore || first.review)) {
        return Number(second.popularityScore || second.review) - Number(first.popularityScore || first.review);
      }
      return Number(second.ratingCount || 0) - Number(first.ratingCount || 0);
    })
    .slice(0, 3);
}

export function getPriceRangeStatus(product) {
  const price = Number(product?.price) || 0;
  const range = product?.marketRange || '';
  const [minText, maxText] = range.split('-');
  const minPrice = Number(minText);
  const maxPrice = Number(maxText);

  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
    return { status: 'standard', label: 'standard' };
  }

  if (price > maxPrice) {
    return { status: 'overpriced', label: 'overpriced' };
  }

  if (price < minPrice) {
    return { status: 'budget-friendly', label: 'budget-friendly' };
  }

  return { status: 'fair', label: 'fair' };
}
