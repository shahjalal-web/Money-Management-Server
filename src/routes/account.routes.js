const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', accountController.getAll);
router.post('/', accountController.create);
router.put('/:id', accountController.update);
router.delete('/:id', accountController.remove);

module.exports = router;
