const IncomeSourceModel = require('../models/income-source.model');
const { success, error } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const sources = await IncomeSourceModel.findByUserId(req.user._id);
    return success(res, sources);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, icon } = req.body;
    if (!name) return error(res, 'name is required');
    const source = await IncomeSourceModel.create({ userId: req.user._id, name, icon });
    return success(res, source, 201);
  } catch (err) {
    if (err.code === 11000) return error(res, 'Income source with this name already exists');
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const source = await IncomeSourceModel.findById(id);
    if (!source || source.userId.toString() !== req.user._id.toString()) {
      return error(res, 'Income source not found', 404);
    }
    const updated = await IncomeSourceModel.updateById(id, req.body);
    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const source = await IncomeSourceModel.findById(id);
    if (!source || source.userId.toString() !== req.user._id.toString()) {
      return error(res, 'Income source not found', 404);
    }
    await IncomeSourceModel.softDelete(id);
    return success(res, { message: 'Income source deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, remove };
