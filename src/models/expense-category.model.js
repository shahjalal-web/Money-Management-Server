const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const COLLECTION = 'expenseCategories';

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
    icon: data.icon || null,
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
  if (data.icon !== undefined) updateData.icon = data.icon;

  return getCollection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateData },
    { returnDocument: 'after' }
  );
}

async function softDelete(id) {
  return getCollection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { isActive: false, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
}

module.exports = { createIndexes, findByUserId, findById, create, updateById, softDelete };
