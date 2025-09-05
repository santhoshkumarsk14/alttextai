// OpenAI Service for AltTextAI
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in the environment variables.');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze image and generate alt text with product context
 * @param {string} imagePath - Path to the image file
 * @param {object} productMetadata - Product metadata for context-aware generation
 * @returns {Promise<object>} - Generated alt text and analysis
 */
async function analyzeImageAndGenerateAltText(imagePath, productMetadata = {}) {
  try {
    // Read image as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Determine the correct MIME type based on file extension
    const fileExtension = path.extname(imagePath).toLowerCase();
    let mimeType = 'image/png'; // Default to PNG
    
    if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
      mimeType = 'image/jpeg';
    } else if (fileExtension === '.webp') {
      mimeType = 'image/webp';
    } else if (fileExtension === '.gif') {
      mimeType = 'image/gif';
    }
    
    // Construct prompt with product metadata for context
    let contextPrompt = "Analyze this product image and generate SEO-optimized alt text.";
    
    // Add product metadata to prompt if available
    if (Object.keys(productMetadata).length > 0) {
      contextPrompt += " Use the following product information for context:";
      
      if (productMetadata.title) {
        contextPrompt += `\nProduct Title: ${productMetadata.title}`;
      }
      
      if (productMetadata.category) {
        contextPrompt += `\nProduct Category: ${productMetadata.category}`;
      }
      
      if (productMetadata.collection) {
        contextPrompt += `\nCollection: ${productMetadata.collection}`;
      }
      
      if (productMetadata.tags && productMetadata.tags.length > 0) {
        contextPrompt += `\nTags: ${productMetadata.tags.join(', ')}`;
      }
      
      if (productMetadata.template) {
        contextPrompt += `\nUse this template format: ${productMetadata.template}`;
      }
    }
    
    // Add instructions for output format
    contextPrompt += "\n\nIMPORTANT: Respond ONLY with a valid JSON object. Do not include any markdown formatting, code blocks, or additional text. The JSON must contain these exact fields: seo_alt_text, ada_alt_text, main_subject, colors (array), materials (array), setting, style, gender_target, confidence_score (number), keywords_used (array), seo_score (number), competitor_keywords (array).";
    
    // Call OpenAI API with base64-encoded image
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert e-commerce SEO specialist focused on generating optimized alt text for product images. Your alt text should be descriptive, include relevant keywords, and follow accessibility best practices. Always respond with valid JSON only, no markdown or additional text."
        },
        {
          role: "user",
          content: [
            { type: "text", text: contextPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });
    
    // Parse and return the response
    const result = response.choices[0].message.content;
    let cleanResult = result.trim();

    // Try multiple parsing strategies
    let parsedResult = null;

    console.log("Raw OpenAI response:", cleanResult);

    // Strategy 1: Try to extract and parse JSON from markdown
    try {
      let jsonContent = cleanResult;

      // Extract JSON from markdown code blocks
      if (jsonContent.includes('```json')) {
        const jsonStart = jsonContent.indexOf('```json');
        if (jsonStart !== -1) {
          const afterJsonMarker = jsonContent.substring(jsonStart + 7).trim();
          const jsonEnd = afterJsonMarker.indexOf('```');
          if (jsonEnd !== -1) {
            jsonContent = afterJsonMarker.substring(0, jsonEnd).trim();
          } else {
            jsonContent = afterJsonMarker;
          }
        }
      }

      // Clean and parse
      jsonContent = jsonContent.replace(/^json\s*/i, '').trim();
      console.log("Attempting JSON parse:", jsonContent);

      parsedResult = JSON.parse(jsonContent);
      console.log("✅ JSON parsing successful:", parsedResult);

    } catch (jsonError) {
      console.log("JSON parsing failed, trying manual extraction...");

      // Strategy 2: Manual key-value extraction
      try {
        const extractedData = {};

        // Extract alt_text
        const altTextMatch = cleanResult.match(/"alt_text"\s*:\s*"([^"]+)"/i);
        if (altTextMatch) {
          extractedData.alt_text = altTextMatch[1];
        }

        // Extract seo_score
        const seoScoreMatch = cleanResult.match(/"seo_score"\s*:\s*(\d+)/i);
        if (seoScoreMatch) {
          extractedData.seo_score = parseInt(seoScoreMatch[1]);
        }

        // Extract keywords array
        const keywordsMatch = cleanResult.match(/"keywords"\s*:\s*\[([^\]]+)\]/i);
        if (keywordsMatch) {
          const keywordsStr = keywordsMatch[1];
          const keywordMatches = keywordsStr.match(/"([^"]+)"/g);
          if (keywordMatches) {
            extractedData.keywords = keywordMatches.map(match => match.replace(/"/g, ''));
          }
        }

        // Extract analysis
        const analysisMatch = cleanResult.match(/"analysis"\s*:\s*"([^"]+(?:\\.[^"]*)*)"/i);
        if (analysisMatch) {
          extractedData.analysis = analysisMatch[1].replace(/\\"/g, '"');
        }

        if (extractedData.alt_text || extractedData.seo_score || extractedData.keywords) {
          parsedResult = extractedData;
          console.log("✅ Manual extraction successful:", parsedResult);
        }

      } catch (manualError) {
        console.log("Manual extraction also failed");
      }
    }

    // If we have a parsed result, map it to expected format
    if (parsedResult) {
      parsedResult = {
        seo_alt_text: parsedResult.alt_text || parsedResult.seo_alt_text || extractAltText(result),
        ada_alt_text: parsedResult.ada_alt_text || parsedResult.ada_compliant_description || "",
        main_subject: parsedResult.main_subject || parsedResult.subject || "",
        colors: parsedResult.colors || [],
        materials: parsedResult.materials || [],
        setting: parsedResult.setting || "",
        style: parsedResult.style || "",
        gender_target: parsedResult.gender_target || "",
        confidence_score: parsedResult.confidence_score || 0.85,
        keywords_used: parsedResult.keywords || parsedResult.keywords_used || extractKeywords(result),
        seo_score: parsedResult.seo_score || 85,
        competitor_keywords: parsedResult.competitor_keywords || []
      };

      console.log("✅ Final mapped result:", parsedResult);
    } else {
      // Ultimate fallback
      console.log("❌ All parsing strategies failed, using fallback");
      parsedResult = {
        seo_alt_text: extractAltText(result),
        ada_alt_text: "",
        main_subject: "",
        colors: [],
        materials: [],
        setting: "",
        style: "",
        gender_target: "",
        confidence_score: 0.75,
        keywords_used: extractKeywords(result),
        seo_score: 75,
        competitor_keywords: []
      };
    }
    
    return parsedResult;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Process multiple images in bulk
 * @param {Array<string>} imagePaths - Array of image paths
 * @param {Array<object>} productMetadataArray - Array of product metadata objects
 * @returns {Promise<Array<object>>} - Array of generated alt texts and analyses
 */
async function processBulkImages(imagePaths, productMetadataArray = []) {
  const results = [];
  
  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i];
    const productMetadata = productMetadataArray[i] || {};
    
    try {
      const result = await analyzeImageAndGenerateAltText(imagePath, productMetadata);
      results.push({
        imagePath,
        ...result
      });
    } catch (error) {
      results.push({
        imagePath,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Generate alt text using a specific template
 * @param {object} imageAnalysis - Image analysis data
 * @param {string} template - Template string with placeholders
 * @param {object} metadata - Product metadata
 * @returns {string} - Formatted alt text
 */
function generateAltTextFromTemplate(imageAnalysis, template, metadata) {
  let formattedAltText = template;
  
  // Replace template placeholders with actual values
  const placeholders = {
    '{Product Type}': metadata.category || imageAnalysis.product_type || '',
    '{Color}': imageAnalysis.color || '',
    '{Target Gender}': metadata.gender || imageAnalysis.gender || '',
    '{Brand}': metadata.brand || '',
    '{Material}': imageAnalysis.material || '',
    '{Style}': imageAnalysis.style || '',
    '{Product Name}': metadata.title || '',
    '{Room}': imageAnalysis.room || ''
  };
  
  // Replace each placeholder in the template
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    formattedAltText = formattedAltText.replace(placeholder, value);
  });
  
  // Clean up any remaining placeholders and double spaces
  formattedAltText = formattedAltText
    .replace(/\{[^}]+\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return formattedAltText;
}

/**
 * Extract alt text from unstructured response
 * @param {string} text - Unstructured text response
 * @returns {string} - Extracted alt text
 */
function extractAltText(text) {
  // Try to find alt text in the response using regex patterns
  const altTextPatterns = [
    /"alt_text"\s*:\s*"([^"]+)"/i,
    /"seo_alt_text"\s*:\s*"([^"]+)"/i,
    /alt text:?\s*["']?([^"'\n]+)["']?/i,
    /alt text\s*=\s*["']?([^"'\n]+)["']?/i,
    /suggested alt text:?\s*["']?([^"'\n]+)["']?/i,
    /alt_text["']?\s*:\s*["']([^"']+)["']/i
  ];

  for (const pattern of altTextPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Look for content after "alt_text": in the text
  const altTextMatch = text.match(/"alt_text"\s*:\s*"([^"]*)/i);
  if (altTextMatch && altTextMatch[1]) {
    return altTextMatch[1].trim();
  }

  // If no pattern matches, try to extract from the first meaningful line
  const lines = text.split('\n').filter(line => line.trim().length > 10);
  for (const line of lines) {
    // Skip lines that are just JSON keys or markdown
    if (!line.includes('{') && !line.includes('}') && !line.includes('```') && !line.includes('"analysis"')) {
      const cleanLine = line.replace(/^["\s]*/, '').replace(/["\s]*$/, '');
      if (cleanLine.length > 20 && cleanLine.length < 150) {
        return cleanLine;
      }
    }
  }

  // Last resort: return a portion of the text
  return text.split('\n')[0].substring(0, 125).trim() || "AI-generated alt text for the image";
}

/**
 * Extract keywords from unstructured response
 * @param {string} text - Unstructured text response
 * @returns {Array<string>} - Extracted keywords
 */
function extractKeywords(text) {
  const keywords = [];

  // Try to find keywords array in JSON
  const keywordsMatch = text.match(/"keywords"\s*:\s*\[([^\]]+)\]/i);
  if (keywordsMatch) {
    const keywordsStr = keywordsMatch[1];
    const keywordMatches = keywordsStr.match(/"([^"]+)"/g);
    if (keywordMatches) {
      keywords.push(...keywordMatches.map(match => match.replace(/"/g, '')));
    }
  }

  // Try alternative JSON format
  const altKeywordsMatch = text.match(/"keywords":\s*\[([^\]]+)\]/i);
  if (altKeywordsMatch && keywords.length === 0) {
    const keywordsStr = altKeywordsMatch[1];
    const keywordMatches = keywordsStr.match(/["']([^"']+)["']/g);
    if (keywordMatches) {
      keywords.push(...keywordMatches.map(match => match.replace(/["']/g, '')));
    }
  }

  // If no keywords found, extract common product-related words from the text
  if (keywords.length === 0) {
    // Look for quoted keywords in the text
    const quotedKeywords = text.match(/"([^"]+)"/g);
    if (quotedKeywords) {
      keywords.push(...quotedKeywords.map(match => match.replace(/"/g, '')).filter(word => word.length > 2));
    }

    // Extract common product-related words
    const commonWords = text.toLowerCase().match(/\b(modern|wooden|chair|wall|clock|gold|design|floral|decor|style|aesthetic|contemporary|elegant|metallic|leaves|flower|round|face|accents|slatted|backrest|dining|office|furniture)\b/g);
    if (commonWords) {
      keywords.push(...[...new Set(commonWords)].slice(0, 5)); // Remove duplicates and limit to 5
    }
  }

  return keywords.slice(0, 5); // Limit to 5 keywords max
}

export {
  analyzeImageAndGenerateAltText,
  processBulkImages,
  generateAltTextFromTemplate
};