const AccountModel = require('../models/account.model');
const { success, error } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const accounts = await AccountModel.findByUserId(req.user._id);
    return success(res, accounts);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, currency, icon, color } = req.body;
    if (!name || !currency) {
      return error(res, 'name and currency are required');
    }
    const account = await AccountModel.create({
      userId: req.user._id,
      name,
      currency: currency.toUpperCase(),
      icon,
      color,
    });
    return success(res, account, 201);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, 'Account with this name already exists');
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const account = await AccountModel.findById(id);
    if (!account || account.userId.toString() !== req.user._id.toString()) {
      return error(res, 'Account not found', 404);
    }
    const updated = await AccountModel.updateById(id, req.body);
    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const account = await AccountModel.findById(id);
    if (!account || account.userId.toString() !== req.user._id.toString()) {
      return error(res, 'Account not found', 404);
    }
    await AccountModel.softDelete(id);
    return success(res, { message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, remove };
