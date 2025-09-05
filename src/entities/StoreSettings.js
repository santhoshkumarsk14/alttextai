// Mock data storage - in a real app, this would connect to a database
let storeSettings = [];
let nextId = 1;

export class StoreSettings {
  constructor(data) {
    this.id = data.id || nextId++;
    this.store_name = data.store_name || 'My Store';
    this.platform = data.platform || 'shopify';
    this.default_brand_voice = data.default_brand_voice || 'professional';
    this.alt_text_template = data.alt_text_template || '{Product Name} in {Color} - {Style} {Category}';
    this.keyword_blacklist = data.keyword_blacklist || [];
    this.auto_processing_enabled = data.auto_processing_enabled || false;
    this.ada_compliance_mode = data.ada_compliance_mode || false;
    this.google_search_console_connected = data.google_search_console_connected || false;
    this.subscription_tier = data.subscription_tier || 'starter';
    this.monthly_image_limit = data.monthly_image_limit || 500;
    this.images_processed_this_month = data.images_processed_this_month || 0;
    this.target_market = data.target_market || 'fashion';
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = data.updated_date || new Date().toISOString();
  }

  static async create(data) {
    const settings = new StoreSettings(data);
    storeSettings.push(settings);
    return settings;
  }

  static async list() {
    return [...storeSettings];
  }

  static async findById(id) {
    return storeSettings.find(settings => settings.id === parseInt(id));
  }

  static async update(id, data) {
    const index = storeSettings.findIndex(settings => settings.id === parseInt(id));
    if (index !== -1) {
      storeSettings[index] = {
        ...storeSettings[index],
        ...data,
        updated_date: new Date().toISOString()
      };
      return storeSettings[index];
    }
    throw new Error('Settings not found');
  }

  static async delete(id) {
    const index = storeSettings.findIndex(settings => settings.id === parseInt(id));
    if (index !== -1) {
      return storeSettings.splice(index, 1)[0];
    }
    throw new Error('Settings not found');
  }

  static async getCurrent() {
    return storeSettings[0] || null;
  }

  static async resetUsage() {
    storeSettings.forEach(settings => {
      settings.images_processed_this_month = 0;
      settings.updated_date = new Date().toISOString();
    });
  }

  static getPlanDetails(tier) {
    const plans = {
      starter: { name: "Starter", limit: 500, price: 19 },
      growth: { name: "Growth", limit: 5000, price: 49 },
      agency: { name: "Agency", limit: 50000, price: 199 }
    };
    return plans[tier] || plans.starter;
  }
}
