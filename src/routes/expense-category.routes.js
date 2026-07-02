const express = require('express');
const router = express.Router();
const expenseCategoryController = require('../controllers/expense-category.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', expenseCategoryController.getAll);
router.post('/', expenseCategoryController.create);
router.put('/:id', expenseCategoryController.update);
router.delete('/:id', expenseCategoryController.remove);

module.exports = router;
