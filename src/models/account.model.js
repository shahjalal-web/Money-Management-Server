const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const COLLECTION = 'accounts';

function getCollection() {
  return getDB().collection(COLLECTION);
}

async function createIndexes() {
  const col = getCollection();
  await col.createIndex({ userId: 1 });
  await col.createIndex({ userId: 1, name: 1 }, { unique: true });
}

async function findByUserId(userId) {
  return getCollection().find({ userId: new ObjectId(userId), isActive: true }).toArray();
}

async function findById(id) {
  return getCollection().findOne({ _id: new ObjectId(id) });
}

async function create(data) {
  const now = new Date();
  const doc = {
    userId: new ObjectId(data.userId),
    name: data.name,
    currency: data.currency,
    balance: 0,
    icon: data.icon || null,
    color: data.color || null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  const result = await getCollection().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

async function updateById(id, data) {
  const updateData = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.color !== undefined) updateData.color = data.color;

  const result = await getCollection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateData },
    { returnDocument: 'after' }
  );
  return result;
}

async function softDelete(id) {
  return getCollection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { isActive: false, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
}

async function updateBalance(id, amount) {
  return getCollection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $inc: { balance: amount }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
}

module.exports = { createIndexes, findByUserId, findById, create, updateById, softDelete, updateBalance };
