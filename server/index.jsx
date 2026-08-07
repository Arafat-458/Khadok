const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI || process.env.DB_URI || process.env.DB_CONN || 'mongodb://127.0.0.1:27017';
let db;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const client = new MongoClient(mongoUri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000
});

function collection(name) {
  return db?.collection(name);
}

function requireDatabase(req, res, next) {
  if (!db) return res.status(503).json({ error: 'Database is still connecting. Please try again shortly.' });
  next();
}

function objectId(value, res) {
  if (!ObjectId.isValid(value)) {
    res.status(400).json({ error: 'Invalid id.' });
    return null;
  }
  return new ObjectId(value);
}

function asyncRoute(handler) {
  return async (req, res, next) => {
    try { await handler(req, res, next); } catch (error) { next(error); }
  };
}

app.get('/', (req, res) => res.send('Foodie API is running'));
app.get('/health', (req, res) => res.status(db ? 200 : 503).json({ ready: Boolean(db) }));

app.use(requireDatabase);

app.get('/products', asyncRoute(async (req, res) => {
  res.json(await collection('products').find({}).toArray());
}));

app.get('/product/:id', asyncRoute(async (req, res) => {
  const id = objectId(req.params.id, res);
  if (!id) return;
  res.json(await collection('products').findOne({ _id: id }));
}));

app.post('/products', asyncRoute(async (req, res) => {
  res.status(201).json(await collection('products').insertOne(req.body));
}));

app.put('/products/:id', asyncRoute(async (req, res) => {
  const id = objectId(req.params.id, res);
  if (!id) return;
  res.json(await collection('products').updateOne({ _id: id }, { $set: req.body }));
}));

app.delete('/products/:id', asyncRoute(async (req, res) => {
  const id = objectId(req.params.id, res);
  if (!id) return;
  res.json(await collection('products').deleteOne({ _id: id }));
}));

app.post('/orders', asyncRoute(async (req, res) => {
  const order = {
    ...req.body,
    userId: String(req.body.userId || ''),
    userInfo: { ...req.body.userInfo, email: String(req.body.userInfo?.email || '').trim().toLowerCase() },
    status: req.body.status || req.body.orderStatus || 'Pending',
    createdAt: req.body.createdAt || new Date(),
    updatedAt: new Date()
  };
  res.status(201).json(await collection('orders').insertOne(order));
}));

app.get('/orders', asyncRoute(async (req, res) => {
  res.json(await collection('orders').find({}).sort({ createdAt: -1, orderDate: -1 }).toArray());
}));

app.get('/orders/user/:identifier', asyncRoute(async (req, res) => {
  const identifier = decodeURIComponent(req.params.identifier).trim();
  const email = identifier.toLowerCase();
  const orders = await collection('orders').find({
    $or: [{ userId: identifier }, { 'userInfo.email': email }]
  }).sort({ createdAt: -1, orderDate: -1 }).toArray();
  res.json(orders);
}));

app.get('/order/:id', asyncRoute(async (req, res) => {
  const id = objectId(req.params.id, res);
  if (!id) return;
  res.json(await collection('orders').findOne({ _id: id }));
}));

app.patch('/orders/:id', asyncRoute(async (req, res) => {
  const id = objectId(req.params.id, res);
  if (!id) return;
  const status = String(req.body.status || req.body.orderStatus || '').trim();
  if (!status) return res.status(400).json({ error: 'Order status is required.' });
  const result = await collection('orders').findOneAndUpdate(
    { _id: id },
    { $set: { status, orderStatus: status, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!result) return res.status(404).json({ error: 'Order not found.' });
  res.json(result);
}));

app.delete('/orders/:id', asyncRoute(async (req, res) => {
  const id = objectId(req.params.id, res);
  if (!id) return;
  res.json(await collection('orders').deleteOne({ _id: id }));
}));

app.get('/reviews', asyncRoute(async (req, res) => {
  res.json(await collection('reviews').find({}).sort({ createdAt: -1 }).toArray());
}));

app.get('/reviews/user/:userId', asyncRoute(async (req, res) => {
  res.json(await collection('reviews').find({ userId: String(req.params.userId) }).toArray());
}));

app.get('/reviews/product/:productId', asyncRoute(async (req, res) => {
  const productId = String(req.params.productId);
  const reviews = await collection('reviews').find({ productId }).sort({ createdAt: -1 }).toArray();
  const reviewCount = reviews.length;
  const averageRating = reviewCount ? Number((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount).toFixed(1)) : 0;
  res.json({ reviews, reviewCount, averageRating });
}));

app.get('/reviews/summaries', asyncRoute(async (req, res) => {
  const summaries = await collection('reviews').aggregate([
    { $group: { _id: '$productId', reviewCount: { $sum: 1 }, averageRating: { $avg: '$rating' } } },
    { $project: { _id: 0, productId: '$_id', reviewCount: 1, averageRating: { $round: ['$averageRating', 1] } } }
  ]).toArray();
  res.json(summaries);
}));

app.post('/reviews', asyncRoute(async (req, res) => {
  const review = { ...req.body, productId: String(req.body.productId), userId: String(req.body.userId), updatedAt: new Date() };
  if (!review.productId || !review.userId || !Number(review.rating)) return res.status(400).json({ error: 'Product, user, and rating are required.' });
  await collection('reviews').updateOne(
    { productId: review.productId, userId: review.userId },
    { $set: review, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  res.status(201).json({ review: await collection('reviews').findOne({ productId: review.productId, userId: review.userId }) });
}));

app.delete('/reviews/:id', asyncRoute(async (req, res) => {
  const id = objectId(req.params.id, res);
  if (!id) return;
  res.json(await collection('reviews').deleteOne({ _id: id }));
}));

app.post('/contact', asyncRoute(async (req, res) => {
  res.status(201).json(await collection('messages').insertOne({ ...req.body, createdAt: new Date(), status: 'unread' }));
}));

app.get('/contact', asyncRoute(async (req, res) => {
  res.json(await collection('messages').find({}).sort({ createdAt: -1 }).toArray());
}));

app.get('/contact/:email', asyncRoute(async (req, res) => {
  res.json(await collection('messages').find({ email: req.params.email }).sort({ createdAt: -1 }).toArray());
}));

app.patch('/contact/:id', asyncRoute(async (req, res) => {
  const id = objectId(req.params.id, res);
  if (!id) return;
  res.json(await collection('messages').updateOne({ _id: id }, { $set: { status: req.body.status } }));
}));

app.delete('/contact/:id', asyncRoute(async (req, res) => {
  const id = objectId(req.params.id, res);
  if (!id) return;
  res.json(await collection('messages').deleteOne({ _id: id }));
}));

app.use((error, req, res, next) => {
  console.error('API error:', error);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

async function connectDatabase() {
  try {
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || 'foodieecommerce');
    await Promise.all([
      collection('orders').createIndex({ 'userInfo.email': 1, createdAt: -1 }),
      collection('orders').createIndex({ userId: 1, createdAt: -1 }),
      collection('reviews').createIndex({ productId: 1, userId: 1 }, { unique: true }),
      collection('reviews').createIndex({ productId: 1 })
    ]);
    console.log('MongoDB connected and API is ready.');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
  }
}

app.listen(port, () => {
  console.log(`Foodie API listening on port ${port}`);
  connectDatabase();
});
