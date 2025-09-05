// AI Configuration - Frontend only (Backend handles actual AI processing)
export const AI_CONFIG = {
  // Backend API Configuration
  BACKEND_API_URL: '/api',
  
  // Model Configuration
  DEFAULT_MODEL: 'gpt-4o',
  FALLBACK_MODEL: 'gpt-4',
  
  // Processing Configuration
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
  STREAM_ENABLED: true,
  
  // Image Analysis Configuration
  MAX_IMAGE_SIZE: 20 * 1024 * 1024, // 20MB
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  
  // Real-time Processing Configuration
  STREAMING_DELAY: 50, // milliseconds between chunks
  TYPING_SPEED: 100, // milliseconds per word for typing effect
  
  // SEO Configuration
  MIN_ALT_TEXT_LENGTH: 50,
  MAX_ALT_TEXT_LENGTH: 125,
  MIN_ADA_TEXT_LENGTH: 150,
  MAX_ADA_TEXT_LENGTH: 300,
  
  // Performance Configuration
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Brand Voice Options
  BRAND_VOICES: {
    descriptive: {
      name: "Descriptive",
      description: "Detailed and comprehensive descriptions",
      temperature: 0.3
    },
    professional: {
      name: "Professional",
      description: "Formal and business-like tone",
      temperature: 0.5
    },
    playful: {
      name: "Playful",
      description: "Fun and engaging descriptions",
      temperature: 0.8
    },
    luxury: {
      name: "Luxury",
      description: "Premium and sophisticated tone",
      temperature: 0.4
    }
  },
  
  // Default Prompts
  PROMPTS: {
    IMAGE_ANALYSIS: `You are an expert e-commerce SEO specialist and image analysis AI. Analyze this product image and provide detailed insights including:

1. Main subject and key features
2. Colors and materials detected
3. Style and aesthetic analysis
4. Target audience and use case
5. SEO-optimized alt text (50-125 characters)
6. ADA-compliant description (150-300 characters)
7. Relevant keywords and phrases
8. Competitor analysis insights

Focus on accuracy, SEO optimization, and accessibility compliance.`,

    ALT_TEXT_GENERATION: `Generate highly optimized alt text for this e-commerce product image. Consider:

- Product features and benefits
- Target keywords and SEO optimization
- Accessibility requirements (ADA compliance)
- Brand voice and tone
- User intent and search behavior
- Competitor analysis

Provide both SEO-optimized (50-125 chars) and ADA-compliant (150-300 chars) versions.`,

    SEO_OPTIMIZATION: `Analyze this alt text for SEO optimization and provide improvements:

- Keyword density and placement
- Search intent alignment
- Competitor keyword opportunities
- Click-through rate optimization
- Local SEO considerations
- Mobile search optimization

Provide specific recommendations and improved versions.`
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    API_ERROR: "AI processing temporarily unavailable. Please try again.",
    TIMEOUT_ERROR: "Request timed out. Please try with a smaller image.",
    RATE_LIMIT: "Rate limit exceeded. Please wait a moment and try again.",
    INVALID_IMAGE: "Invalid image format. Please upload JPEG, PNG, or WebP.",
    FILE_TOO_LARGE: "Image file too large. Please use images under 20MB.",
    NETWORK_ERROR: "Network error. Please check your connection and try again."
  }
};

// Real-time processing states
export const PROCESSING_STATES = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  ANALYZING: 'analyzing',
  GENERATING: 'generating',
  OPTIMIZING: 'optimizing',
  COMPLETED: 'completed',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

// AI Response Schema
export const AI_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    seo_alt_text: { 
      type: "string",
      description: "SEO-optimized alt text (50-125 characters)"
    },
    ada_alt_text: { 
      type: "string",
      description: "ADA-compliant description (150-300 characters)"
    },
    main_subject: { 
      type: "string",
      description: "Main subject or product type"
    },
    colors: { 
      type: "array", 
      items: { type: "string" },
      description: "Detected colors in the image"
    },
    materials: { 
      type: "array", 
      items: { type: "string" },
      description: "Detected materials or fabric types"
    },
    setting: { 
      type: "string",
      description: "Background or setting description"
    },
    style: { 
      type: "string",
      description: "Style or aesthetic category"
    },
    gender_target: { 
      type: "string",
      description: "Target gender demographic"
    },
    confidence_score: { 
      type: "number",
      description: "AI confidence in analysis (0-1)"
    },
    keywords_used: { 
      type: "array", 
      items: { type: "string" },
      description: "Keywords incorporated in alt text"
    },
    seo_score: { 
      type: "number",
      description: "SEO optimization score (0-100)"
    },
    competitor_keywords: { 
      type: "array", 
      items: { type: "string" },
      description: "Additional keywords for competitive analysis"
    }
  },
  required: ["seo_alt_text", "ada_alt_text", "main_subject", "confidence_score"]
};

export default AI_CONFIG;
