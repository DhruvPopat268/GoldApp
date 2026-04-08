const multer = require('multer');
const path = require('path');
const { randomUUID } = require('crypto');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',     // animations
  'image/svg+xml', // vector images (⚠ needs caution)
  'image/avif',    // modern compressed format
  'image/heic',    // iPhone images
  'image/heif',    // similar to HEIC
  'image/bmp',     // old but sometimes used
  'image/tiff',    // high-quality images
];
// Explicit safe extension map — never derived from user input
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
};
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Use volume-mounted paths in production, fallback to local uploads/ in dev
const IMAGES_DIR =
  process.env.NODE_ENV === 'production'
    ? '/app/cloud/images'
    : path.resolve(__dirname, '../uploads/gold_items');

const BANKS_DIR =
  process.env.NODE_ENV === 'production'
    ? '/app/cloud/images'
    : path.resolve(__dirname, '../uploads/banks');

const storage = (dest) =>
  multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = MIME_TO_EXT[file.mimetype] || '.jpg';
      cb(null, `${randomUUID()}${ext}`);
    },
  });

const imageFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only jpg, png, and webp image files are allowed'), false);
  }
};

exports.bankUpload = multer({
  storage: storage(BANKS_DIR),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

exports.loanUpload = multer({
  storage: storage(IMAGES_DIR),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

exports.IMAGES_DIR = IMAGES_DIR;
exports.BANKS_DIR = BANKS_DIR;
