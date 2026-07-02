const { getFirebaseAdmin } = require('../config/firebase-admin');
const { getDB } = require('../config/db');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const auth = getFirebaseAdmin();
    const decoded = await auth.verifyIdToken(token);
    const db = getDB();
    const user = await db.collection('users').findOne({ firebaseUid: decoded.uid });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    req.firebaseUser = decoded;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
