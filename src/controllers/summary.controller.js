const AccountModel = require('../models/account.model');
const TransactionModel = require('../models/transaction.model');
const { success } = require('../utils/response');

async function getOverview(req, res, next) {
  try {
    const now = new Date();
    const [accounts, monthlySummary] = await Promise.all([
      AccountModel.findByUserId(req.user._id),
      TransactionModel.getMonthlySummary(req.user._id, now.getFullYear(), now.getMonth() + 1),
    ]);

    return success(res, { accounts, ...monthlySummary });
  } catch (err) {
    next(err);
  }
}

async function getRecent(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const transactions = await TransactionModel.getRecent(req.user._id, limit);
    return success(res, transactions);
  } catch (err) {
    next(err);
  }
}

module.exports = { getOverview, getRecent };
