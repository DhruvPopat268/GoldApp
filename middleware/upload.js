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

const storage = (dest) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      // Resolve destination and ensure it stays within uploads/
      const base = path.resolve(__dirname, '../uploads');
      const target = path.resolve(base, dest);
      if (!target.startsWith(base)) return cb(new Error('Invalid upload destination'));
      cb(null, target);
    },
    filename: (req, file, cb) => {
      // Extension is derived from MIME type — never from user-supplied filename
      const ext = MIME_TO_EXT[file.mimetype] || '.jpg';
      cb(null, `${uuidv4()}${ext}`);
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
  storage: storage('banks'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

exports.loanUpload = multer({
  storage: storage('gold_items'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});
