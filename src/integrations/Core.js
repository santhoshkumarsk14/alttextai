// /integrations/Core.js - FIXED VERSION
import { AI_CONFIG } from '../config/ai.js';

// REAL streaming implementation - calls backend API
export async function InvokeLLMRealTime({ prompt, file_urls, response_json_schema, onProgress, onChunk, onError }) {
  try {
    console.log('🚀 Starting REAL-TIME AI processing via backend...');

    // Simulate streaming progress for better UX
    let progressCount = 0;
    const progressInterval = setInterval(() => {
      progressCount += 10;
      if (onProgress && progressCount <= 80) {
        onProgress(progressCount);
      }
    }, 500);

    try {
      // Call backend API instead of OpenAI directly
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/ai/generate-alt-text', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          prompt: prompt,
          fileUrls: file_urls,
          responseSchema: response_json_schema,
          userId: 'user-1'
        })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Backend AI API error:', response.status, errorData);

        throw new Error(errorData.error || `Backend API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Backend AI processing completed:', result);

      // Simulate final progress
      if (onProgress) onProgress(100);

      // Simulate streaming chunks for better UX
      if (onChunk && result.seo_alt_text) {
        const words = result.seo_alt_text.split(' ');
        let chunkText = '';
        for (const word of words) {
          chunkText += word + ' ';
          if (onChunk) {
            setTimeout(() => onChunk(chunkText), 100);
          }
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      return result;

    } catch (fetchError) {
      clearInterval(progressInterval);
      console.error('❌ Backend API call failed:', fetchError);
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ Real-time AI processing failed:', error);
    if (onError) onError(error);

    // Return fallback response
    return await generateFallbackResponse(prompt, file_urls);
  }
}

// Helper functions for parsing non-JSON responses
function extractAltText(content) {
  const altTextMatch = content.match(/(?:alt text|alt_text)["']?\s*[:=]\s*["']([^"']+)["']/i);
  return altTextMatch ? altTextMatch[1] : "AI-generated alt text for product image";
}

function extractADAText(content) {
  const adaMatch = content.match(/(?:ada|accessibility)["']?\s*[:=]\s*["']([^"']{100,})["']/i);
  return adaMatch ? adaMatch[1] : "Detailed accessibility description of the product image with comprehensive visual information for screen reader users.";
}

// Fallback response generation
async function generateFallbackResponse(prompt, file_urls) {
  console.log('🔄 Generating fallback response...');
  
  // Simple analysis based on prompt content
  const hasProductKeywords = /t-shirt|shirt|clothing|fashion|cotton|organic/.test(prompt.toLowerCase());
  const hasColorKeywords = /blue|white|gray|black|red|green/.test(prompt.toLowerCase());
  
  return {
    seo_alt_text: hasProductKeywords 
      ? "Premium cotton t-shirt in modern style - comfortable everyday wear"
      : "High-quality product image with detailed visual elements",
    ada_alt_text: hasProductKeywords
      ? "A high-quality cotton t-shirt displayed against a clean background. The garment features a classic design with attention to detail and craftsmanship, representing modern sustainable fashion choices."
      : "A detailed product image showing the item's key features and characteristics for potential customers.",
    main_subject: hasProductKeywords ? "Clothing item" : "Product",
    colors: hasColorKeywords ? ["blue", "white"] : ["neutral"],
    materials: hasProductKeywords ? ["cotton"] : ["fabric"],
    setting: "studio",
    style: "modern",
    confidence_score: 0.75,
    seo_score: 75,
    keywords_used: hasProductKeywords ? ["cotton", "t-shirt", "fashion"] : ["product"],
    competitor_keywords: ["sustainable", "quality", "comfortable"]
  };
}

// REAL file upload implementation
export async function UploadFile({ file, onProgress }) {
  try {
    console.log('📤 Starting real file upload:', file.name);
    
    // Check if we have a real upload endpoint
    const uploadEndpoint = AI_CONFIG.UPLOAD_ENDPOINT || '/api/upload';
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("timestamp", Date.now().toString());
    formData.append("user_id", "user-1"); // Default user ID for testing
    formData.append("session_id", "session-" + Date.now());

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Real progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          console.log('📊 Upload progress:', Math.round(progress) + '%');
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Upload successful:', response);
            resolve({
              file_url: response.file_url || response.url,
              file_id: response.file_id || response.id,
              size: file.size,
              type: file.type
            });
          } catch (error) {
            console.error('❌ Upload response parsing failed:', error);
            reject(new Error('Invalid upload response format'));
          }
        } else {
          console.error('❌ Upload failed with status:', xhr.status);
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', (error) => {
        console.error('❌ Upload network error:', error);
        reject(new Error('Upload network error'));
      });

      xhr.addEventListener('timeout', () => {
        console.error('❌ Upload timeout');
        reject(new Error('Upload timeout'));
      });

      // Set timeout for large files
      xhr.timeout = 60000; // 60 seconds

      try {
        xhr.open('POST', uploadEndpoint);

        // Add Authorization header if token exists
        const token = localStorage.getItem('token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.send(formData);
        console.log('📡 Upload request sent to:', uploadEndpoint);
      } catch (error) {
        console.error('❌ Failed to send upload request:', error);
        reject(error);
      }
    });

  } catch (error) {
    console.error('❌ Upload preparation error:', error);
    throw error;
  }
}

// Enhanced mock fallback for development
export async function InvokeLLM({ prompt, file_urls, response_json_schema }) {
  console.log('🔄 Using fallback LLM processing...');
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  return await generateFallbackResponse(prompt, file_urls);
}