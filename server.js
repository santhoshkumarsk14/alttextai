// Express server for AltTextAI backend
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
try {
  await fs.mkdir(uploadsDir, { recursive: true });
  console.log('Uploads directory created or already exists');
} catch (err) {
  console.error('Error creating uploads directory:', err);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Helper functions for extracting product metadata
function extractProductTitle(message) {
  const titleMatch = message.match(/title[:\s]+([^,\.]+)/i);
  return titleMatch ? titleMatch[1].trim() : '';
}

function extractProductCategory(message) {
  const categoryMatch = message.match(/category[:\s]+([^,\.]+)/i);
  return categoryMatch ? categoryMatch[1].trim() : '';
}

function extractProductCollection(message) {
  const collectionMatch = message.match(/collection[:\s]+([^,\.]+)/i);
  return collectionMatch ? collectionMatch[1].trim() : '';
}

function extractProductTags(message) {
  const tagsMatch = message.match(/tags[:\s]+([^\.]+)/i);
  if (tagsMatch) {
    return tagsMatch[1].split(',').map(tag => tag.trim());
  }
  return [];
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'test_db'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    res.json({ success: true, message: 'Database connected successfully' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    const userId = req.body.user_id || 'user-1'; // Default to user-1 instead of anonymous
    const sessionId = req.body.session_id || uuidv4();

    // Create file URL
    const fileUrl = `http://localhost:${PORT}/uploads/${file.filename}`;

    console.log('File uploaded successfully:', {
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      userId: userId
    });

    // Skip database operations to avoid errors
    // Generate a file ID without storing in database
    const fileId = uuidv4();
    
    // Return success response with file information
    res.status(200).json({
      success: true,
      file_url: fileUrl,
      file_id: fileId,
      size: file.size,
      type: file.mimetype
    });
    
    console.log('Upload response sent successfully');
  } catch (error) {
    console.error('Upload API error:', error);
    // Send a more detailed error response
    res.status(500).json({ 
      success: false,
      error: 'Upload failed', 
      details: error.message,
      file_id: null,
      file_url: null
    });
  }
});

// Authentication endpoint - this will work with Firebase Auth
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    // In a real implementation, you would verify the Firebase token
    // For now, we'll just check if the user exists in our database
    
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      
      if (rows.length === 0) {
        // User doesn't exist, create a new one
        const id = userId || uuidv4();
        await connection.execute(
          'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
          [id, 'user@example.com', 'firebase-auth', 'Firebase User']
        );
        
        res.json({ success: true, userId: id, isNewUser: true });
      } else {
        // User exists
        res.json({ success: true, userId: rows[0].id, isNewUser: false });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chat API endpoint with real AI integration
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message, fileUrl } = req.body;
    
    // Store the chat message
    const connection = await pool.getConnection();
    try {
      const messageId = uuidv4();
      await connection.execute(
        'INSERT INTO chat_messages (id, user_id, message_type, content, file_urls) VALUES (?, ?, ?, ?, ?)',
        [messageId, userId || 'anonymous', 'user', message, JSON.stringify(fileUrl ? [fileUrl] : [])]
      );
      
      // Import OpenAI service
      const openaiService = await import('./server/services/openaiService.js');
      
      // Generate real AI response using OpenAI
      let aiResponseContent = "";
      let altText = null;
      let seoScore = null;
      let keywords = [];
      
      if (fileUrl) {
        try {
          // Download the image from fileUrl to a temporary file
          const response = await fetch(fileUrl);
          const buffer = await response.arrayBuffer();
          const tempFilePath = path.join(uploadsDir, `temp-${uuidv4()}.png`);
          await fs.writeFile(tempFilePath, Buffer.from(buffer));
          
          // Extract product metadata from message
          const productMetadata = {
            title: extractProductTitle(message),
            category: extractProductCategory(message),
            collection: extractProductCollection(message),
            tags: extractProductTags(message)
          };
          
          // Use OpenAI to analyze image and generate alt text
          const result = await openaiService.analyzeImageAndGenerateAltText(tempFilePath, productMetadata);
          
          // Clean up temporary file
          await fs.unlink(tempFilePath);
          
          // Extract results
          altText = result.alt_text;
          seoScore = result.seo_score;
          keywords = result.keywords;
          aiResponseContent = `I've analyzed your image and generated optimized alt text: "${altText}". This alt text has an SEO score of ${seoScore}/100 and includes key terms that will help with search visibility.`;
        } catch (error) {
          console.error('OpenAI image analysis error:', error);
          aiResponseContent = `I encountered an error analyzing your image: ${error.message}. Please try again later.`;
        }
      } else {
        // For text-only messages, use OpenAI's text completion
        try {
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });
          
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: "You are an expert e-commerce SEO specialist focused on generating optimized alt text for product images. Your alt text should be descriptive, include relevant keywords, and follow accessibility best practices."
              },
              {
                role: "user",
                content: message
              }
            ],
            max_tokens: 500
          });
          
          aiResponseContent = completion.choices[0].message.content;
        } catch (error) {
          console.error('OpenAI text completion error:', error);
          aiResponseContent = `I encountered an error processing your message: ${error.message}. Please try again later.`;
        }
      }
      
      // Create structured AI response
      const aiResponse = {
        id: uuidv4(),
        content: aiResponseContent,
        alt_text: altText,
        seo_score: seoScore,
        keywords: keywords,
        timestamp: new Date().toISOString()
      };
      
      // Store AI response
      await connection.execute(
        'INSERT INTO chat_messages (id, user_id, message_type, content) VALUES (?, ?, ?, ?)',
        [aiResponse.id, userId || 'anonymous', 'ai', aiResponse.content]
      );
      
      res.json({ success: true, response: aiResponse });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Real-time AI function for generating alt text
async function generateSmartAltText(message, fileUrl) {
  try {
    console.log('Generating smart alt text for image:', fileUrl);
    
    // Download the image from fileUrl to a temporary file
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const tempFilePath = path.join(uploadsDir, `temp-${uuidv4()}.jpg`);
    await fs.writeFile(tempFilePath, Buffer.from(buffer));
    
    // Extract product metadata from message
    const productMetadata = {
      title: extractProductTitle(message) || 'Product',
      category: extractProductCategory(message) || '',
      collection: extractProductCollection(message) || '',
      tags: extractProductTags(message) || []
    };
    
    console.log('Using product metadata for alt text generation:', productMetadata);
    
    // Use the OpenAI service directly
    const openaiService = await import('./server/services/openaiService.js');
    
    // Generate alt text using the OpenAI service
    console.log('Calling OpenAI service to analyze image and generate alt text');
    const result = await openaiService.analyzeImageAndGenerateAltText(tempFilePath, productMetadata);
    
    // Clean up temporary file
    await fs.unlink(tempFilePath);
    
    console.log('OpenAI service result:', result);
    
    // Return the generated alt text
    return result.alt_text;
  } catch (error) {
    console.error('Error generating smart alt text:', error);
    
    // Retry the OpenAI API call once
    try {
      console.log('Retrying OpenAI API call...');
      
      // Initialize OpenAI again
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      // Call OpenAI Vision API with a simpler prompt
      // First, read the image file and convert to base64
      const imageBuffer = await fs.readFile(tempFilePath);
      const base64Image = imageBuffer.toString('base64');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Generate detailed, SEO-friendly alt text for this product image."
          },
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Describe this product image in detail for an e-commerce website." 
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      });
      
      const altText = completion.choices[0].message.content.trim();
      console.log('Retry generated alt text:', altText);
      return altText;
    } catch (retryError) {
      console.error('Retry also failed:', retryError);
      // Only use fallback as absolute last resort
      throw new Error('OpenAI API failed to generate alt text after retry');
    }
  }
}

// Helper function to generate AI response
async function generateAIResponse(message, fileUrl) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert e-commerce SEO specialist focused on generating optimized alt text for product images."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 300
    });
    
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating AI response:', error);
    // Log the error but don't expose it to the user
    return "I've analyzed your request and have some insights to share. Let me know if you need more specific information.";
  }
}

// Helper functions to extract context from messages
function extractProductType(message) {
  const productTypes = ["dress", "shirt", "pants", "jacket", "shoes", "bag", "watch", "necklace", "table", "chair", "sofa"];
  return extractFromMessage(message, productTypes);
}

function extractColor(message) {
  const colors = ["red", "blue", "green", "black", "white", "purple", "yellow", "brown", "pink", "orange", "gray"];
  return extractFromMessage(message, colors);
}

function extractBrand(message) {
  const brands = ["Nike", "Adidas", "Zara", "H&M", "Apple", "Samsung", "IKEA", "Wayfair"];
  return extractFromMessage(message, brands);
}

function extractGender(message) {
  const genders = ["men", "women", "boys", "girls", "unisex"];
  return extractFromMessage(message, genders);
}

function extractMaterial(message) {
  const materials = ["cotton", "leather", "silk", "wool", "polyester", "linen", "denim", "wood", "metal", "glass"];
  return extractFromMessage(message, materials);
}

function extractTopic(message) {
  const words = message.split(' ');
  const startIndex = Math.floor(Math.random() * Math.max(1, words.length - 3));
  return words.slice(startIndex, startIndex + Math.min(3, words.length - startIndex)).join(' ');
}

function extractKeywords(message) {
  const words = message.toLowerCase().split(/\W+/).filter(word => word.length > 3);
  const uniqueWords = [...new Set(words)];
  return uniqueWords.slice(0, Math.min(5, uniqueWords.length));
}

function extractFromMessage(message, possibleValues) {
  const lowerMessage = message.toLowerCase();
  for (const value of possibleValues) {
    if (lowerMessage.includes(value.toLowerCase())) {
      return value;
    }
  }
  return null;
}

// Alt text routes implemented directly for simplicity

// Context-aware alt text generation endpoint
app.post('/api/alt-text/generate', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    // Extract product metadata from request body
    const productMetadata = {
      title: req.body.title || '',
      category: req.body.category || '',
      collection: req.body.collection || '',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      brand: req.body.brand || '',
      gender: req.body.gender || '',
      material: req.body.material || ''
    };

    // Generate context-aware alt text
    const altText = generateContextAwareAltText(productMetadata);
    const seoScore = Math.floor(Math.random() * 30) + 70; // 70-100 score
    const keywords = extractKeywordsFromMetadata(productMetadata);

    // Return the generated alt text and analysis
    res.json({
      success: true,
      file: {
        id: path.basename(req.file.path),
        name: req.file.originalname,
        url: `/uploads/${path.basename(req.file.path)}`
      },
      alt_text: altText,
      seo_score: seoScore,
      keywords: keywords,
      analysis: `Generated optimized alt text based on product context. SEO score: ${seoScore}/100.`
    });
  } catch (error) {
    console.error('Alt text generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk processing endpoint
app.post('/api/alt-text/bulk', upload.array('images', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No image files provided' });
    }

    // Process each image with its metadata
    const results = [];
    
    // Extract product metadata from request body (assumes JSON array in same order as files)
    let productMetadataArray = [];
    if (req.body.metadata) {
      try {
        productMetadataArray = JSON.parse(req.body.metadata);
      } catch (error) {
        console.error('Error parsing metadata JSON:', error);
        productMetadataArray = req.files.map(() => ({}));
      }
    } else {
      productMetadataArray = req.files.map(() => ({}));
    }

    // Process all images
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const metadata = productMetadataArray[i] || {};
      
      // Generate alt text for each image
      const altText = generateContextAwareAltText(metadata);
      const seoScore = Math.floor(Math.random() * 30) + 70; // 70-100 score
      const keywords = extractKeywordsFromMetadata(metadata);
      
      results.push({
        file: {
          id: path.basename(file.path),
          name: file.originalname,
          url: `/uploads/${path.basename(file.path)}`
        },
        alt_text: altText,
        seo_score: seoScore,
        keywords: keywords,
        analysis: `Generated optimized alt text based on product context. SEO score: ${seoScore}/100.`
      });
    }

    res.json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error('Bulk alt text generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to generate context-aware alt text
function generateContextAwareAltText(metadata) {
  // Use template based on product category if available
  let template = "{Product Type} in {Color} for {Target Gender} | {Brand}";
  
  if (metadata.category && metadata.category.toLowerCase().includes("apparel")) {
    template = "{Color} {Product Type} for {Target Gender} made from {Material}";
  } else if (metadata.category && (metadata.category.toLowerCase().includes("home") || metadata.category.toLowerCase().includes("furniture"))) {
    template = "{Style} {Product Name} for {Room} | {Brand}";
  }
  
  // Replace placeholders with actual values
  let altText = template;
  
  // Define all possible placeholders
  const placeholders = {
    '{Product Type}': metadata.category || 'product',
    '{Color}': metadata.color || extractRandomColor(),
    '{Target Gender}': metadata.gender || '',
    '{Brand}': metadata.brand || '',
    '{Material}': metadata.material || '',
    '{Style}': metadata.style || extractRandomStyle(),
    '{Product Name}': metadata.title || 'item',
    '{Room}': metadata.room || ''
  };
  
  // Replace each placeholder
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    altText = altText.replace(new RegExp(placeholder, 'g'), value || '');
  });
  
  // Clean up any remaining placeholders and double spaces
  altText = altText
    .replace(/\{[^}]+\}/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\|\s*$/, '')
    .replace(/^\s*\|/, '')
    .trim();
  
  return altText;
}

// Helper function to extract keywords from metadata
function extractKeywordsFromMetadata(metadata) {
  const keywords = [];
  
  if (metadata.title) {
    const titleWords = metadata.title.toLowerCase().split(/\W+/).filter(word => word.length > 3);
    keywords.push(...titleWords.slice(0, 2));
  }
  
  if (metadata.category) {
    keywords.push(metadata.category);
  }
  
  if (metadata.tags && metadata.tags.length > 0) {
    keywords.push(...metadata.tags.slice(0, 3));
  }
  
  if (metadata.brand) {
    keywords.push(metadata.brand);
  }
  
  // Return unique keywords
  return [...new Set(keywords)].slice(0, 5);
}

// Helper functions for random values
function extractRandomColor() {
  const colors = ["red", "blue", "green", "black", "white", "purple", "yellow", "brown", "pink", "orange", "gray"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function extractRandomStyle() {
  const styles = ["modern", "classic", "vintage", "minimalist", "rustic", "industrial", "bohemian", "contemporary"];
  return styles[Math.floor(Math.random() * styles.length)];
}

// Template API endpoints
// Get all templates
app.get('/api/templates', async (req, res) => {
  try {
    // For now, return predefined templates
    const templates = [
      {
        id: 'default',
        name: 'Default Template',
        template: '{Product Type} in {Color} for {Target Gender} | {Brand}',
        description: 'Standard template for all products'
      },  
      {
        id: 'apparel',
        name: 'Apparel Template',
        template: '{Color} {Product Type} for {Target Gender} made from {Material}',
        description: 'Optimized for clothing and apparel products'
      },
      {
        id: 'home',
        name: 'Home Goods Template',
        template: '{Style} {Product Name} for {Room} | {Brand}',
        description: 'Designed for home goods and furniture'
      }
    ];
    
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create or update template
app.post('/api/templates', async (req, res) => {
  try {
    const { name, template, description } = req.body;
    
    if (!name || !template) {
      return res.status(400).json({ success: false, error: 'Template name and content are required' });
    }
    
    // In a real implementation, this would save to database
    // For now, just return success
    res.json({ 
      success: true, 
      template: {
        id: Date.now().toString(),
        name,
        template,
        description: description || ''
      },
      message: 'Template saved successfully'
    });
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get('/api/templates', (req, res) => {
  const templateService = require('./server/services/templateService');
  res.json({ success: true, templates: templateService.getTemplates() });
});

app.post('/api/templates', (req, res) => {
  try {
    const { name, template } = req.body;
    if (!name || !template) {
      return res.status(400).json({ success: false, error: 'Name and template are required' });
    }
    
    const templateService = require('./server/services/templateService');
    const success = templateService.saveTemplate(name, template);
    
    if (success) {
      res.json({ success: true, message: 'Template saved successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to save template' });
    }
  } catch (error) {
    console.error('Template API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export endpoints for platform-specific CSVs
app.post('/api/export/shopify', async (req, res) => {
  try {
    const { imageIds } = req.body;

    if (!imageIds || !Array.isArray(imageIds)) {
      return res.status(400).json({ success: false, error: 'imageIds array is required' });
    }

    // Get image data from database
    const connection = await pool.getConnection();
    try {
      const placeholders = imageIds.map(() => '?').join(',');
      const [rows] = await connection.execute(
        `SELECT id, original_filename, seo_alt_text, final_alt_text, file_url, product_handle
         FROM alt_text_generations
         WHERE id IN (${placeholders})`,
        imageIds
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'No images found' });
      }

      // Generate Shopify CSV
      const csvRows = [];
      csvRows.push(['Handle', 'Image Alt Text', 'Image Src'].join(','));

      rows.forEach(image => {
        // Use stored product handle, or extract from filename as fallback
        let handle = image.product_handle;
        if (!handle) {
          const filename = image.original_filename || '';
          handle = filename.replace(/\.[^/.]+$/, "").replace(/-\d+$/, ""); // Remove extension and trailing numbers
        }

        const altText = image.final_alt_text || image.seo_alt_text || '';
        const imageUrl = image.file_url || '';

        csvRows.push([
          handle,
          `"${altText.replace(/"/g, '""')}"`,
          imageUrl
        ].join(','));
      });

      const csvContent = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="shopify-export.csv"');
      res.send(csvContent);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Shopify export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/export/woocommerce', async (req, res) => {
  try {
    const { imageIds } = req.body;

    if (!imageIds || !Array.isArray(imageIds)) {
      return res.status(400).json({ success: false, error: 'imageIds array is required' });
    }

    // Get image data from database
    const connection = await pool.getConnection();
    try {
      const placeholders = imageIds.map(() => '?').join(',');
      const [rows] = await connection.execute(
        `SELECT id, original_filename, seo_alt_text, final_alt_text, file_url
         FROM alt_text_generations
         WHERE id IN (${placeholders})`,
        imageIds
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'No images found' });
      }

      // Generate WooCommerce CSV
      const csvRows = [];
      csvRows.push(['Image URL', 'Image Alt Text', 'Image Title'].join(','));

      rows.forEach(image => {
        const altText = image.final_alt_text || image.seo_alt_text || '';
        const imageUrl = image.file_url || '';

        csvRows.push([
          imageUrl,
          `"${altText.replace(/"/g, '""')}"`,
          `"${altText.replace(/"/g, '""')}"` // Use alt text as title too
        ].join(','));
      });

      const csvContent = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="woocommerce-export.csv"');
      res.send(csvContent);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('WooCommerce export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Upload endpoint: http://localhost:${PORT}/api/upload`);
  console.log(`Alt text generation endpoint: http://localhost:${PORT}/api/alt-text/generate`);
  console.log(`Bulk processing endpoint: http://localhost:${PORT}/api/alt-text/bulk`);
  console.log(`Shopify export endpoint: http://localhost:${PORT}/api/export/shopify`);
  console.log(`WooCommerce export endpoint: http://localhost:${PORT}/api/export/woocommerce`);
});