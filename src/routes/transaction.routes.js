const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', transactionController.getAll);
router.get('/:id', transactionController.getById);
router.post('/income', transactionController.createIncome);
router.post('/expense', transactionController.createExpense);
router.post('/transfer', transactionController.createTransfer);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
