const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const COLLECTION = 'transactions';

function getCollection() {
  return getDB().collection(COLLECTION);
}

async function createIndexes() {
  const col = getCollection();
  await col.createIndex({ userId: 1, date: -1 });
  await col.createIndex({ userId: 1, type: 1 });
  await col.createIndex({ userId: 1, accountId: 1 });
}

async function findByUserId(userId, filters = {}) {
  const query = { userId: new ObjectId(userId) };

  if (filters.type) query.type = filters.type;
  if (filters.accountId) {
    query.$or = [
      { accountId: new ObjectId(filters.accountId) },
      { fromAccountId: new ObjectId(filters.accountId) },
      { toAccountId: new ObjectId(filters.accountId) },
    ];
  }
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate) query.date.$lte = new Date(filters.endDate);
  }

  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    getCollection().find(query).sort({ date: -1 }).skip(skip).limit(limit).toArray(),
    getCollection().countDocuments(query),
  ]);

  return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function findById(id) {
  return getCollection().findOne({ _id: new ObjectId(id) });
}

async function create(data) {
  const now = new Date();
  const doc = {
    userId: new ObjectId(data.userId),
    type: data.type,
    date: new Date(data.date || now),
    notes: data.notes || '',
    createdAt: now,
    updatedAt: now,
  };

  if (data.type === 'income') {
    doc.accountId = new ObjectId(data.accountId);
    doc.incomeSourceId = new ObjectId(data.incomeSourceId);
    doc.amount = data.amount;
    doc.currency = data.currency;
  } else if (data.type === 'expense') {
    doc.accountId = new ObjectId(data.accountId);
    doc.expenseCategoryId = new ObjectId(data.expenseCategoryId);
    doc.amount = data.amount;
    doc.currency = data.currency;
  } else if (data.type === 'transfer') {
    doc.fromAccountId = new ObjectId(data.fromAccountId);
    doc.toAccountId = new ObjectId(data.toAccountId);
    doc.fromAmount = data.fromAmount;
    doc.fromCurrency = data.fromCurrency;
    doc.toAmount = data.toAmount;
    doc.toCurrency = data.toCurrency;
    doc.exchangeRate = data.exchangeRate;
    doc.fee = data.fee || 0;
  }

  const result = await getCollection().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

async function updateById(id, data) {
  const updateData = { updatedAt: new Date() };
  const allowedFields = [
    'amount', 'currency', 'notes', 'date', 'accountId', 'incomeSourceId',
    'expenseCategoryId', 'fromAccountId', 'toAccountId', 'fromAmount',
    'fromCurrency', 'toAmount', 'toCurrency', 'exchangeRate', 'fee',
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (['accountId', 'incomeSourceId', 'expenseCategoryId', 'fromAccountId', 'toAccountId'].includes(field)) {
        updateData[field] = new ObjectId(data[field]);
      } else if (field === 'date') {
        updateData[field] = new Date(data[field]);
      } else {
        updateData[field] = data[field];
      }
    }
  }

  return getCollection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateData },
    { returnDocument: 'after' }
  );
}

async function deleteById(id) {
  return getCollection().deleteOne({ _id: new ObjectId(id) });
}

async function getRecent(userId, limit = 10) {
  return getCollection()
    .find({ userId: new ObjectId(userId) })
    .sort({ date: -1 })
    .limit(limit)
    .toArray();
}

async function getMonthlySummary(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const result = await getCollection().aggregate([
    {
      $match: {
        userId: new ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        type: { $in: ['income', 'expense'] },
      },
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]).toArray();

  const summary = { totalIncome: 0, totalExpense: 0, incomeCount: 0, expenseCount: 0 };
  for (const item of result) {
    if (item._id === 'income') {
      summary.totalIncome = item.total;
      summary.incomeCount = item.count;
    } else if (item._id === 'expense') {
      summary.totalExpense = item.total;
      summary.expenseCount = item.count;
    }
  }

  return summary;
}

module.exports = {
  createIndexes, findByUserId, findById, create, updateById,
  deleteById, getRecent, getMonthlySummary,
};
