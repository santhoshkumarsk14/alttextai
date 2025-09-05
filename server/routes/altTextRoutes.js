// Alt Text Generation Routes
import express from 'express';
const router = express.Router();
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { analyzeImageAndGenerateAltText } from '../services/openaiService.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  }
});

// Generate alt text for a single image with context
router.post('/generate', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    console.log('Processing image for alt text generation:', req.file.originalname);

    // Extract product metadata from request body
    const productMetadata = {
      title: req.body.title || '',
      category: req.body.category || '',
      collection: req.body.collection || '',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      brand: req.body.brand || '',
      gender: req.body.gender || '',
      material: req.body.material || '',
      template: req.body.template || ''
    };

    console.log('Using product metadata:', productMetadata);

    // Generate alt text with context using OpenAI
    const imagePath = req.file.path;
    const result = await analyzeImageAndGenerateAltText(imagePath, productMetadata);

    console.log('OpenAI generated result:', result);

    // Return the generated alt text and analysis
    res.json({
      success: true,
      file: {
        id: path.basename(imagePath),
        name: req.file.originalname,
        url: `/uploads/${path.basename(imagePath)}`
      },
      alt_text: result.alt_text,
      seo_score: result.seo_score,
      keywords: result.keywords,
      analysis: result.analysis
    });
  } catch (error) {
    console.error('Alt text generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk processing endpoint for multiple images
router.post('/bulk', upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No image files provided' });
    }

    console.log(`Processing ${req.files.length} images for bulk alt text generation`);

    // Process each image
    const results = [];
    for (const file of req.files) {
      // Extract product metadata from request body
      const productMetadata = {
        title: req.body.title || '',
        category: req.body.category || '',
        collection: req.body.collection || '',
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
        brand: req.body.brand || '',
        gender: req.body.gender || '',
        material: req.body.material || '',
        template: req.body.template || ''
      };

      console.log(`Generating alt text for ${file.originalname} with metadata:`, productMetadata);

      try {
        // Generate alt text with context using OpenAI Vision API
        const imagePath = file.path;
        const result = await analyzeImageAndGenerateAltText(imagePath, productMetadata);

        console.log(`Generated result for ${file.originalname}:`, result);

        results.push({
          file: {
            id: path.basename(imagePath),
            name: file.originalname,
            url: `/uploads/${path.basename(imagePath)}`
          },
          alt_text: result.alt_text,
          seo_score: result.seo_score,
          keywords: result.keywords,
          analysis: result.analysis
        });
      } catch (error) {
        console.error(`Error processing ${file.originalname}:`, error);
        
        // Add error result but continue processing other images
        results.push({
          file: {
            id: path.basename(file.path),
            name: file.originalname,
            url: `/uploads/${path.basename(file.path)}`
          },
          alt_text: "Error generating alt text",
          seo_score: 0,
          keywords: [],
          analysis: `Error: ${error.message}`
        });
      }
    }

    // Return the generated alt texts and analyses
    res.json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error('Bulk alt text generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;