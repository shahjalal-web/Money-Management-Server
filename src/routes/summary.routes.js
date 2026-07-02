const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summary.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/overview', summaryController.getOverview);
router.get('/recent', summaryController.getRecent);

module.exports = router;
