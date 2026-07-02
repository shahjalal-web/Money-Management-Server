const express = require('express');
const router = express.Router();
const incomeSourceController = require('../controllers/income-source.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', incomeSourceController.getAll);
router.post('/', incomeSourceController.create);
router.put('/:id', incomeSourceController.update);
router.delete('/:id', incomeSourceController.remove);

module.exports = router;
