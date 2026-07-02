const TransactionModel = require('../models/transaction.model');
const AccountModel = require('../models/account.model');
const { success, error } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const filters = {
      type: req.query.type,
      accountId: req.query.accountId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page,
      limit: req.query.limit,
    };
    const result = await TransactionModel.findByUserId(req.user._id, filters);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const transaction = await TransactionModel.findById(req.params.id);
    if (!transaction || transaction.userId.toString() !== req.user._id.toString()) {
      return error(res, 'Transaction not found', 404);
    }
    return success(res, transaction);
  } catch (err) {
    next(err);
  }
}

async function createIncome(req, res, next) {
  try {
    const { accountId, incomeSourceId, amount, date, notes } = req.body;
    if (!accountId || !incomeSourceId || !amount) {
      return error(res, 'accountId, incomeSourceId, and amount are required');
    }
    if (amount <= 0) return error(res, 'Amount must be positive');

    const account = await AccountModel.findById(accountId);
    if (!account || account.userId.toString() !== req.user._id.toString()) {
      return error(res, 'Account not found', 404);
    }

    const transaction = await TransactionModel.create({
      userId: req.user._id,
      type: 'income',
      accountId,
      incomeSourceId,
      amount,
      currency: account.currency,
      date,
      notes,
    });

    await AccountModel.updateBalance(accountId, amount);
    return success(res, transaction, 201);
  } catch (err) {
    next(err);
  }
}

async function createExpense(req, res, next) {
  try {
    const { accountId, expenseCategoryId, amount, date, notes } = req.body;
    if (!accountId || !expenseCategoryId || !amount) {
      return error(res, 'accountId, expenseCategoryId, and amount are required');
    }
    if (amount <= 0) return error(res, 'Amount must be positive');

    const account = await AccountModel.findById(accountId);
    if (!account || account.userId.toString() !== req.user._id.toString()) {
      return error(res, 'Account not found', 404);
    }

    const transaction = await TransactionModel.create({
      userId: req.user._id,
      type: 'expense',
      accountId,
      expenseCategoryId,
      amount,
      currency: account.currency,
      date,
      notes,
    });

    await AccountModel.updateBalance(accountId, -amount);
    return success(res, transaction, 201);
  } catch (err) {
    next(err);
  }
}

async function createTransfer(req, res, next) {
  try {
    const { fromAccountId, toAccountId, fromAmount, fee, exchangeRate, toAmount, date, notes } = req.body;
    if (!fromAccountId || !toAccountId || !fromAmount || !exchangeRate) {
      return error(res, 'fromAccountId, toAccountId, fromAmount, and exchangeRate are required');
    }
    if (fromAmount <= 0) return error(res, 'Amount must be positive');
    if (fromAccountId === toAccountId) return error(res, 'Cannot transfer to the same account');

    const transferFee = fee || 0;
    if (transferFee < 0) return error(res, 'Fee cannot be negative');
    if (transferFee >= fromAmount) return error(res, 'Fee cannot be greater than or equal to the transfer amount');

    const fromAccount = await AccountModel.findById(fromAccountId);
    if (!fromAccount || fromAccount.userId.toString() !== req.user._id.toString()) {
      return error(res, 'Source account not found', 404);
    }

    const toAccount = await AccountModel.findById(toAccountId);
    if (!toAccount || toAccount.userId.toString() !== req.user._id.toString()) {
      return error(res, 'Destination account not found', 404);
    }

    const expectedToAmount = (fromAmount - transferFee) * exchangeRate;
    const submittedToAmount = toAmount || expectedToAmount;
    if (Math.abs(expectedToAmount - submittedToAmount) > 0.01) {
      return error(res, 'Received amount does not match calculation');
    }

    const transaction = await TransactionModel.create({
      userId: req.user._id,
      type: 'transfer',
      fromAccountId,
      toAccountId,
      fromAmount,
      fromCurrency: fromAccount.currency,
      toAmount: submittedToAmount,
      toCurrency: toAccount.currency,
      exchangeRate,
      fee: transferFee,
      date,
      notes,
    });

    await Promise.all([
      AccountModel.updateBalance(fromAccountId, -fromAmount),
      AccountModel.updateBalance(toAccountId, submittedToAmount),
    ]);

    return success(res, transaction, 201);
  } catch (err) {
    next(err);
  }
}

async function deleteTransaction(req, res, next) {
  try {
    const transaction = await TransactionModel.findById(req.params.id);
    if (!transaction || transaction.userId.toString() !== req.user._id.toString()) {
      return error(res, 'Transaction not found', 404);
    }

    if (transaction.type === 'income') {
      await AccountModel.updateBalance(transaction.accountId, -transaction.amount);
    } else if (transaction.type === 'expense') {
      await AccountModel.updateBalance(transaction.accountId, transaction.amount);
    } else if (transaction.type === 'transfer') {
      await Promise.all([
        AccountModel.updateBalance(transaction.fromAccountId, transaction.fromAmount),
        AccountModel.updateBalance(transaction.toAccountId, -transaction.toAmount),
      ]);
    }

    await TransactionModel.deleteById(req.params.id);
    return success(res, { message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, createIncome, createExpense, createTransfer, deleteTransaction };
