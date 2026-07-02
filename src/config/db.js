const { MongoClient } = require('mongodb');

let db = null;
let client = null;

async function connectDB() {
  if (db) return db;
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db();
  console.log('MongoDB connected successfully');
  return db;
}

function getDB() {
  if (!db) throw new Error('Database not initialized. Call connectDB() first.');
  return db;
}

function getClient() {
  if (!client) throw new Error('Client not initialized. Call connectDB() first.');
  return client;
}

module.exports = { connectDB, getDB, getClient };
