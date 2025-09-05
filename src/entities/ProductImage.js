import { imagesApi } from '@/api/images';

export class ProductImage {
  constructor(data) {
    this.id = data.id;
    this.filename = data.filename || data.original_filename;
    this.file_url = data.file_url;
    this.product_title = data.product_title || '';
    this.product_category = data.product_category || '';
    this.collection_name = data.collection_name || '';
    this.target_keywords = data.target_keywords || [];
    this.competitor_keywords = data.competitor_keywords || [];
    this.original_alt_text = data.original_alt_text || '';
    this.generated_alt_text = data.generated_alt_text || data.seo_alt_text || '';
    this.ada_alt_text = data.ada_alt_text || '';
    this.final_alt_text = data.final_alt_text || '';
    this.status = data.status || data.approval_status || 'uploaded';
    this.project_name = data.project_name || '';
    this.brand_voice = data.brand_voice || 'professional';
    this.image_position = data.image_position || 'main';
    this.seo_score = data.seo_score || 0;
    this.ada_compliant = data.ada_compliant || false;
    this.keywords = data.keywords || data.keywords_used || [];
    this.image_analysis = data.image_analysis || {};
    this.product_handle = data.product_handle || ''; // For Shopify product handle
    this.performance_metrics = data.performance_metrics || {
      impressions: 0,
      clicks: 0,
      ctr: 0,
      rank_improvement: 0
    };
    this.created_date = data.created_date || data.created_at;
    this.updated_date = data.updated_date || data.updated_at;
  }

  static async create(data) {
    // For now, return a new instance - actual creation would be handled by upload
    return new ProductImage(data);
  }

  static async list(sortBy = '-created_date', limit = null) {
    const images = await imagesApi.getAll(sortBy);
    return images.map(img => new ProductImage(img));
  }

  static async findById(id) {
    const image = await imagesApi.getById(id);
    return image ? new ProductImage(image) : null;
  }

  static async filter(filters, sortBy = '-created_date') {
    // For now, get all and filter client-side
    const images = await imagesApi.getAll(sortBy);
    let filteredImages = images.filter(img => {
      return Object.entries(filters).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.includes(img[key]);
        }
        return img[key] === value;
      });
    });

    return filteredImages.map(img => new ProductImage(img));
  }

  static async update(id, data) {
    const updatedImage = await imagesApi.update(id, data);
    return updatedImage ? new ProductImage(updatedImage) : null;
  }

  static async delete(id) {
    return await imagesApi.delete(id);
  }

  static async bulkUpdate(ids, data) {
    const updatedImages = await imagesApi.bulkUpdate(ids, data);
    return updatedImages.map(img => new ProductImage(img));
  }

  static async getStats() {
    const stats = await imagesApi.getStats();
    return stats || {
      total: 0,
      processed: 0,
      thisMonth: 0,
      timeSaved: 0
    };
  }

  static async getProjects() {
    // This would need a separate API endpoint
    // For now, return empty array
    return [];
  }
}
