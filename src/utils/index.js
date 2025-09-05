import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function createPageUrl(pageName, params = {}) {
  const baseUrl = `/${pageName.toLowerCase()}`;
  
  if (Object.keys(params).length === 0) {
    return baseUrl;
  }
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, value);
    }
  });
  
  return `${baseUrl}?${searchParams.toString()}`;
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a valid image file (JPG, PNG, WebP)' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  return { valid: true };
}

export function calculateSEOScore(altText, keywords = []) {
  let score = 0;
  
  // Length score (optimal: 50-125 characters)
  const length = altText.length;
  if (length >= 50 && length <= 125) {
    score += 30;
  } else if (length >= 30 && length <= 150) {
    score += 20;
  } else {
    score += 10;
  }
  
  // Keyword presence
  if (keywords.length > 0) {
    const keywordMatches = keywords.filter(keyword => 
      altText.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    score += Math.min(keywordMatches * 15, 30);
  }
  
  // Descriptive words
  const descriptiveWords = ['vintage', 'modern', 'classic', 'elegant', 'comfortable', 'durable', 'premium', 'organic', 'sustainable'];
  const hasDescriptiveWords = descriptiveWords.some(word => 
    altText.toLowerCase().includes(word)
  );
  if (hasDescriptiveWords) score += 20;
  
  // Avoid generic words
  const genericWords = ['image', 'picture', 'photo', 'img'];
  const hasGenericWords = genericWords.some(word => 
    altText.toLowerCase().includes(word)
  );
  if (!hasGenericWords) score += 20;
  
  return Math.min(score, 100);
}

export function generateAltTextTemplate(productName, color, style, category, brandName = '') {
  const templates = [
    `${productName} in ${color} - ${style} ${category}`,
    `${color} ${productName} - ${style} ${category} for modern lifestyle`,
    `${brandName ? brandName + ' ' : ''}${productName} in ${color} - premium ${category}`,
    `${style} ${productName} in ${color} - perfect for ${category} enthusiasts`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

export function extractKeywords(text) {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
}

export function getStatusColor(status) {
  const colors = {
    uploaded: 'bg-blue-100 text-blue-800',
    processing: 'bg-yellow-100 text-yellow-800',
    generated: 'bg-purple-100 text-purple-800',
    approved: 'bg-green-100 text-green-800',
    exported: 'bg-gray-100 text-gray-800',
    live: 'bg-emerald-100 text-emerald-800'
  };
  
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusIcon(status) {
  const icons = {
    uploaded: 'Upload',
    processing: 'Clock',
    generated: 'FileText',
    approved: 'CheckCircle',
    exported: 'Download',
    live: 'Globe'
  };
  
  return icons[status] || 'File';
}
