const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const COLLECTION = 'users';

function getCollection() {
  return getDB().collection(COLLECTION);
}

async function createIndexes() {
  const col = getCollection();
  await col.createIndex({ firebaseUid: 1 }, { unique: true });
  await col.createIndex({ email: 1 });
}

async function findByFirebaseUid(firebaseUid) {
  return getCollection().findOne({ firebaseUid });
}

async function findById(id) {
  return getCollection().findOne({ _id: new ObjectId(id) });
}

async function upsertByFirebaseUid(firebaseUid, data) {
  const now = new Date();
  const result = await getCollection().findOneAndUpdate(
    { firebaseUid },
    {
      $set: { ...data, updatedAt: now },
      $setOnInsert: { firebaseUid, defaultCurrency: 'BDT', createdAt: now },
    },
    { upsert: true, returnDocument: 'after' }
  );
  return result;
}

async function updateById(id, data) {
  const result = await getCollection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return result;
}

module.exports = { createIndexes, findByFirebaseUid, findById, upsertByFirebaseUid, updateById };
