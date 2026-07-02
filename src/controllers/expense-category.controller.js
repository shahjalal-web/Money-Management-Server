const ExpenseCategoryModel = require('../models/expense-category.model');
const { success, error } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const categories = await ExpenseCategoryModel.findByUserId(req.user._id);
    return success(res, categories);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, icon } = req.body;
    if (!name) return error(res, 'name is required');
    const category = await ExpenseCategoryModel.create({ userId: req.user._id, name, icon });
    return success(res, category, 201);
  } catch (err) {
    if (err.code === 11000) return error(res, 'Expense category with this name already exists');
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const category = await ExpenseCategoryModel.findById(id);
    if (!category || category.userId.toString() !== req.user._id.toString()) {
      return error(res, 'Expense category not found', 404);
    }
    const updated = await ExpenseCategoryModel.updateById(id, req.body);
    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const category = await ExpenseCategoryModel.findById(id);
    if (!category || category.userId.toString() !== req.user._id.toString()) {
      return error(res, 'Expense category not found', 404);
    }
    await ExpenseCategoryModel.softDelete(id);
    return success(res, { message: 'Expense category deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, remove };
