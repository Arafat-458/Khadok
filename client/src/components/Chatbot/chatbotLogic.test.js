import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAssistantReply, detectHealthConcern, parseBudget, extractPriceUpdate } from './chatbotLogic.js';

const products = [
  { id: 1, title: 'Pizza', price: 10, marketRange: '8-12', healthTags: ['diabetes', 'cholesterol'] },
  { id: 2, title: 'Vegetable Burger', price: 8, marketRange: '7-11', healthTags: ['diabetes', 'cholesterol'] },
  { id: 3, title: 'Mushroom Pasta', price: 12, marketRange: '10-15', healthTags: ['diabetes', 'cholesterol'] }
];

test('parses a budget request and returns a budget-aware reply', () => {
  const reply = buildAssistantReply(products, 'budget 20');
  assert.equal(parseBudget('budget 20'), 20);
  assert.match(reply.reply, /20/);
});

test('detects diabetes-friendly requests', () => {
  const concern = detectHealthConcern('show diabetes friendly food');
  assert.equal(concern?.type, 'diabetes');
});

test('extracts price update requests for a known product', () => {
  const update = extractPriceUpdate('change price of Pizza to 12', products);
  assert.deepEqual(update, {
    productId: 1,
    title: 'Pizza',
    newPrice: 12
  });
});
