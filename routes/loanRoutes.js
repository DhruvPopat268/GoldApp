const express = require('express');
const router = express.Router();
const {
  createLoan,
  getLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
  restoreLoan,
  getTrashLoans,
  getLoansHistory,
  getLoansSummary,
  regeneratePDF,
  getLoansByDate,
} = require('../controllers/loanController');
const { loanUpload } = require('../middleware/upload');
const auth = require('../middleware/authMiddleware');

const itemImageFields = [{ name: 'item_image', maxCount: 10 }];

router.use(auth);

router.post('/', loanUpload.fields(itemImageFields), createLoan);
router.post('/by-date', getLoansByDate);
router.get('/', getLoans);
router.get('/trash', getTrashLoans);
router.get('/history', getLoansHistory);
router.get('/summary', getLoansSummary);
router.get('/:id', getLoanById);
router.post('/:id/regenerate-pdf', regeneratePDF);
router.put('/:id/restore', restoreLoan);
router.put('/:id', loanUpload.fields(itemImageFields), updateLoan);
router.delete('/:id', deleteLoan);

module.exports = router;
