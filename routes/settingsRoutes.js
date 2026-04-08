const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const auth = require('../middleware/authMiddleware');
const { bankUpload } = require('../middleware/upload');

router.use(auth);

router.get('/', getSettings);
router.put('/', bankUpload.single('logo'), updateSettings);

module.exports = router;
