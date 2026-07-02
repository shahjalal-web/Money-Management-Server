const UserModel = require('../models/user.model');
const { success, error } = require('../utils/response');

async function syncUser(req, res, next) {
  try {
    const { firebaseUid, email, displayName, photoURL } = req.body;
    if (!firebaseUid || !email) {
      return error(res, 'firebaseUid and email are required');
    }
    const user = await UserModel.upsertByFirebaseUid(firebaseUid, { email, displayName, photoURL });
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    return success(res, req.user);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { displayName, defaultCurrency } = req.body;
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (defaultCurrency !== undefined) updateData.defaultCurrency = defaultCurrency;

    const user = await UserModel.updateById(req.user._id, updateData);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

module.exports = { syncUser, getMe, updateProfile };
