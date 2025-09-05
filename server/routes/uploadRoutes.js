// Upload routes
import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { handleFileUpload } from '../controllers/uploadController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') } // Default 10MB
});

// Upload route
router.post('/', (req, res, next) => {
  console.log('Upload route hit:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });
  next();
}, upload.single('file'), (req, res, next) => {
  console.log('After multer processing:', {
    file: req.file ? 'present' : 'missing',
    fileDetails: req.file
  });
  next();
}, handleFileUpload);

export default router;