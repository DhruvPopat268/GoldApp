const express = require('express');
const router = express.Router();
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  restoreCategory,
  getTrashCategories,
  bulkImportCategories,
} = require('../controllers/categoryController');
const auth = require('../middleware/authMiddleware');
const { categoryRules, categoryUpdateRules, validate } = require('../middleware/validators');

router.use(auth);

router.post('/', categoryRules, validate, createCategory);
router.post('/bulk', bulkImportCategories);
router.get('/', getCategories);
router.get('/trash', getTrashCategories);
router.put('/:id/restore', restoreCategory);
router.put('/:id', categoryUpdateRules, validate, updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
