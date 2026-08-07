import { updateProductPrice } from '../Products/productCatalog.js';

const HEALTH_TEMPLATES = {
  diabetes: {
    label: 'diabetes-friendly',
    summary: 'lower-sugar and lighter choices'
  },
  cholesterol: {
    label: 'heart-friendly',
    summary: 'lighter and less oily choices'
  }
};

function normalizeText(message) {
  return String(message || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\u0980-\u09FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeNumberToken(value) {
  const bengaliDigits = {'০': 0, '১': 1, '২': 2, '৩': 3, '৪': 4, '৫': 5, '৬': 6, '৭': 7, '৮': 8, '৯': 9};
  const normalized = String(value || '').trim();
  return Number(
    normalized
      .split('')
      .map((char) => bengaliDigits[char] ?? char)
      .join('')
  );
}

const hasOrderIntent = (message) => /\b(order|buy|book|place|want|need|chai|lagbe|nibo|অর্ডার|কিনব|কিনতে|বুক|চাই|লাগবে|নেব|নিব|খেতে চাই|অর্ডার\s*করব|অর্ডার\s*কর|wait|serial|সিরিয়াল|অপেক্ষা)\b/i.test(normalizeText(message));

export function extractOrderProduct(message, products) {
  if (!hasOrderIntent(message)) return null;
  const normalized = normalizeText(message);
  return products.find((product) => {
    const title = normalizeText(product.title);
    return normalized.includes(title) || title.split(' ').some((word) => word.length > 2 && normalized.includes(word));
  }) || null;
}

export function detectHealthConcern(message) {
  const normalized = normalizeText(message);

  if (/(diabetes|diabetic|diabetis|blood sugar|sugar|low sugar|শর্করা|চিনি|ডায়াবেটিক|ডায়াবেটিস)/.test(normalized)) {
    return { type: 'diabetes', ...HEALTH_TEMPLATES.diabetes };
  }

  if (/(cholesterol|high cholesterol|cholestrol|heart healthy|heart|fat|fats|oil|oily|রক্তচাপ|কোলেস্টেরল|ফ্যাট|তেল|হার্ট|হৃদয়)/.test(normalized)) {
    return { type: 'cholesterol', ...HEALTH_TEMPLATES.cholesterol };
  }

  return null;
}

export function parseBudget(message) {
  const normalized = normalizeText(message);
  const budgetMatch = normalized.match(/(?:budget|amount|bujet|টাকার|টাকা|tk|taka|৳)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?|[০-৯]+)/i)
    || normalized.match(/(?:under|below|up to|within|এর মধ্যে|মধ্যে)\s*(\d+(?:\.\d+)?|[০-৯]+)/i)
    || normalized.match(/(?:for|for me|আমার)\s*(\d+(?:\.\d+)?|[০-৯]+)\s*(?:taka|tk|টাকা|৳)/i);

  if (!budgetMatch) {
    return null;
  }

  return normalizeNumberToken(budgetMatch[1]);
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

export function getOrderInfo(orderCount) {
  const serialNo = orderCount + 1;
  return {
    serialNo,
    waitTime: 15 + serialNo * 5
  };
}

export function extractPriceUpdate(message, products) {
  const normalized = normalizeText(message);
  const productMatch = products.find((product) => {
    const title = normalizeText(product.title);
    return normalized.includes(title) || title.split(' ').some((word) => normalized.includes(word) && word.length > 2);
  });

  if (!productMatch) {
    return null;
  }

  const priceSignal = normalized.match(/(?:price|dam|rate|cost|মূল্য|দাম)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?|[০-৯]+)/i)
    || normalized.match(/(?:to|=|:|এ)\s*(\d+(?:\.\d+)?|[০-৯]+)/i);

  if (!priceSignal) {
    return null;
  }

  return {
    productId: productMatch.id,
    title: productMatch.title,
    newPrice: normalizeNumberToken(priceSignal[1])
  };
}

function detectPrimaryIntent(message, products) {
  const normalized = normalizeText(message);
  const hasPriceUpdate = extractPriceUpdate(message, products);
  const wantsOrder = hasOrderIntent(normalized);
  const hasHealthIntent = /(diabetes|diabetis|blood sugar|sugar|low sugar|cholesterol|heart|fat|oil|healthy|health|রক্তচাপ|কোলেস্টেরল|ফ্যাট|তেল|হার্ট|হৃদয়|স্বাস্থ্য)/i.test(normalized);
  const hasBudgetIntent = /(budget|bujet|amount|price|cost|টাকা|tk|taka|৳|বাজেট|মূল্য|দাম)/i.test(normalized);

  if (hasPriceUpdate) {
    return 'price-update';
  }

  if (wantsOrder) {
    return 'order';
  }

  if (hasHealthIntent) {
    return 'health';
  }

  if (hasBudgetIntent) {
    return 'budget';
  }

  return 'general';
}

export function buildAssistantReply(products, message, isAdmin = false, queueInfo = null) {
  const healthConcern = detectHealthConcern(message);
  const budget = parseBudget(message);
  const intent = detectPrimaryIntent(message, products);
  const priceUpdate = extractPriceUpdate(message, products);

  let candidates = [...products];
  let reply = '';
  let packageSuggestion = null;
  let orderInfo = null;
  let updatedCatalog = null;

  if (intent === 'price-update' && priceUpdate) {
    if (!isAdmin) {
      reply = 'দুঃখিত। শুধু admin account-দিয়ে price change request পাঠানো যাবে।';
      return {
        reply,
        suggestions: products,
        packageSuggestion,
        orderInfo,
        updatedCatalog,
        action: { type: 'blocked' }
      };
    }

    updatedCatalog = updateProductPrice(priceUpdate.productId, priceUpdate.newPrice, products);
    const updatedProduct = updatedCatalog.find((product) => String(product.id) === String(priceUpdate.productId));
    reply = `আপনি ${updatedProduct?.title || priceUpdate.title} এর দাম ${updatedProduct?.price || priceUpdate.newPrice} টাকায় আপডেট করেছেন।`;
    return {
      reply,
      suggestions: updatedCatalog,
      packageSuggestion,
      orderInfo,
      updatedCatalog,
      action: { type: 'price-update', product: updatedProduct }
    };
  }

  if (intent === 'health' && healthConcern) {
    candidates = candidates.filter((product) => {
      const tags = product?.healthTags || [];
      return tags.includes(healthConcern.label) || tags.includes(healthConcern.type);
    });
  }

  if (intent === 'budget' && budget) {
    candidates = candidates.filter((product) => Number(product.price) <= budget);
  }

  const rankedCandidates = candidates
    .map((product) => ({ ...product, priceStatus: getPriceRangeStatus(product) }))
    .sort((first, second) => {
      if (first.priceStatus.status === 'overpriced' && second.priceStatus.status !== 'overpriced') {
        return 1;
      }

      if (first.priceStatus.status !== 'overpriced' && second.priceStatus.status === 'overpriced') {
        return -1;
      }

      return Number(first.price) - Number(second.price);
    })
    .slice(0, 3);

  const fallbackCandidates = products
    .map((product) => ({ ...product, priceStatus: getPriceRangeStatus(product) }))
    .sort((first, second) => Number(first.price) - Number(second.price))
    .slice(0, 3);

  const suggestions = rankedCandidates.length > 0 ? rankedCandidates : fallbackCandidates;

  if (intent === 'health' && healthConcern) {
    reply = `আপনার ${healthConcern.type} অনুযায়ী আমি ${suggestions.map((item) => `${item.title} (${item.price} টাকা)`).join(', ')} সাজেস্ট করছি, কারণ এগুলো ${healthConcern.summary}।`;
  } else if (intent === 'budget' && budget) {
    reply = `আপনার ${budget} টাকার বাজেটে আমি ${suggestions.map((item) => `${item.title} (${item.price} টাকা)`).join(', ')} সাজেস্ট করছি।`;

    if (budget > 0) {
      // Greedily pack the lowest-priced suitable foods so the platter contains
      // as many items as possible without crossing the customer's budget.
      const packageItems = [...candidates]
        .filter((item) => Number(item.price) > 0 && Number(item.price) <= budget)
        .sort((first, second) => Number(first.price) - Number(second.price))
        .reduce((selected, item) => {
          const totalSoFar = selected.reduce((sum, current) => sum + Number(current.price), 0);
          return totalSoFar + Number(item.price) <= budget ? [...selected, item] : selected;
        }, []);
      const total = packageItems.reduce((sum, item) => sum + Number(item.price), 0);

      if (packageItems.length > 0) {
      packageSuggestion = {
        title: 'Budget platter',
        items: packageItems,
        total,
        budget
      };
      reply += ` আপনার জন্য ${packageItems.map((item) => item.title).join(' + ')} নিয়ে Budget Platter করা যাবে। মোট ${total} টাকা, বাকি ${budget - total} টাকা। পছন্দ হলে “confirm platter” লিখুন।`;
      } else {
        reply += ' এই বাজেটে কোনো available item পাওয়া যায়নি।';
      }
    }
  } else if (intent === 'order') {
    if (queueInfo?.product) {
      orderInfo = {
        product: queueInfo.product,
        serialNo: queueInfo.queueCount + 1,
        waitTime: 15 + queueInfo.queueCount * 8
      };
      reply = `${queueInfo.product.title}-এর জন্য আপনার serial no: #${orderInfo.serialNo}. আগে একই product-এর ${queueInfo.queueCount}টি active order আছে। আনুমানিক wait ${orderInfo.waitTime} মিনিট। নিচের button দিয়ে checkout করুন।`;
    } else {
      reply = 'কোন product অর্ডার করতে চান? যেমন: “order Pizza” বা “Burger অর্ডার করব” লিখুন।';
    }
  } else {
    reply = 'আমি স্বাস্থ্যভিত্তিক খাবার, বাজেট-ভিত্তিক সাজেশন আর অর্ডার ট্র্যাকিংয়ে সাহায্য করতে পারি। উদাহরণ: “diabetes-friendly food”, “budget 20”, বা “change price of Pizza to 12”。';
  }

  const overpricedItems = suggestions.filter((item) => item.priceStatus.status === 'overpriced');
  if (overpricedItems.length > 0 && intent !== 'order') {
    const names = overpricedItems.map((item) => `${item.title} (${item.price} টাকা)`).join(', ');
    reply += ` নোট: ${names} সাধারণ বাজারদর থেকে বেশি, তাই এগুলো overpriced মনে হতে পারে।`;
  }

  return {
    reply,
    suggestions,
    packageSuggestion,
    orderInfo,
    updatedCatalog,
    action: null
  };
}
