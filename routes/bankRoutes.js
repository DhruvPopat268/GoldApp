const express = require('express');
const router = express.Router();
const {
  createBank,
  getBanks,
  updateBank,
  deleteBank,
  restoreBank,
  getTrashBanks,
} = require('../controllers/bankController');
const { bankUpload } = require('../middleware/upload');
const auth = require('../middleware/authMiddleware');
const { bankRules, bankUpdateRules, validate } = require('../middleware/validators');

router.use(auth);

router.post('/', bankUpload.single('logo'), bankRules, validate, createBank);
router.get('/', getBanks);
router.get('/trash', getTrashBanks);
router.put('/:id/restore', restoreBank);
router.put('/:id', bankUpload.single('logo'), bankUpdateRules, validate, updateBank);
router.delete('/:id', deleteBank);

module.exports = router;
