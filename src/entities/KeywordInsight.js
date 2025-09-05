// Mock data storage - in a real app, this would connect to a database
let keywordInsights = [];
let nextId = 1;

export class KeywordInsight {
  constructor(data) {
    this.id = data.id || nextId++;
    this.keyword = data.keyword;
    this.search_volume = data.search_volume || 0;
    this.competition = data.competition || 'medium';
    this.current_rank = data.current_rank || null;
    this.opportunity_score = data.opportunity_score || 0;
    this.category = data.category || '';
    this.competitor_using = data.competitor_using || false;
    this.suggested_for_images = data.suggested_for_images || 0;
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = data.updated_date || new Date().toISOString();
  }

  static async create(data) {
    const insight = new KeywordInsight(data);
    keywordInsights.push(insight);
    return insight;
  }

  static async list(sortBy = '-opportunity_score', limit = null) {
    let sortedInsights = [...keywordInsights];
    
    if (sortBy.startsWith('-')) {
      const field = sortBy.substring(1);
      sortedInsights.sort((a, b) => {
        if (field === 'opportunity_score') {
          return b[field] - a[field];
        }
        return b[field] - a[field];
      });
    } else {
      sortedInsights.sort((a, b) => {
        if (sortBy === 'opportunity_score') {
          return a[sortBy] - b[sortBy];
        }
        return a[sortBy] - b[sortBy];
      });
    }
    
    if (limit) {
      sortedInsights = sortedInsights.slice(0, limit);
    }
    
    return sortedInsights;
  }

  static async findById(id) {
    return keywordInsights.find(insight => insight.id === parseInt(id));
  }

  static async findByKeyword(keyword) {
    return keywordInsights.find(insight => 
      insight.keyword.toLowerCase() === keyword.toLowerCase()
    );
  }

  static async findByCategory(category) {
    return keywordInsights.filter(insight => 
      insight.category.toLowerCase() === category.toLowerCase()
    );
  }

  static async getTopOpportunities(limit = 10) {
    return keywordInsights
      .filter(insight => insight.opportunity_score > 70)
      .sort((a, b) => b.opportunity_score - a.opportunity_score)
      .slice(0, limit);
  }

  static async getCompetitorKeywords() {
    return keywordInsights.filter(insight => insight.competitor_using);
  }

  static async update(id, data) {
    const index = keywordInsights.findIndex(insight => insight.id === parseInt(id));
    if (index !== -1) {
      keywordInsights[index] = {
        ...keywordInsights[index],
        ...data,
        updated_date: new Date().toISOString()
      };
      return keywordInsights[index];
    }
    throw new Error('Keyword insight not found');
  }

  static async delete(id) {
    const index = keywordInsights.findIndex(insight => insight.id === parseInt(id));
    if (index !== -1) {
      return keywordInsights.splice(index, 1)[0];
    }
    throw new Error('Keyword insight not found');
  }

  static async getStats() {
    const total = keywordInsights.length;
    const highOpportunity = keywordInsights.filter(k => k.opportunity_score > 70).length;
    const competitorKeywords = keywordInsights.filter(k => k.competitor_using).length;
    const avgOpportunityScore = keywordInsights.reduce((sum, k) => sum + k.opportunity_score, 0) / total || 0;

    return {
      total,
      highOpportunity,
      competitorKeywords,
      avgOpportunityScore
    };
  }

  static async generateMockData() {
    const mockKeywords = [
      { keyword: 'organic cotton t-shirt', search_volume: 12000, competition: 'high', opportunity_score: 85, category: 'clothing' },
      { keyword: 'sustainable fashion', search_volume: 8500, competition: 'medium', opportunity_score: 78, category: 'clothing' },
      { keyword: 'vintage denim jacket', search_volume: 6500, competition: 'medium', opportunity_score: 72, category: 'clothing' },
      { keyword: 'minimalist sneakers', search_volume: 9800, competition: 'high', opportunity_score: 68, category: 'shoes' },
      { keyword: 'eco-friendly bags', search_volume: 4200, competition: 'low', opportunity_score: 82, category: 'accessories' },
      { keyword: 'handmade jewelry', search_volume: 7500, competition: 'medium', opportunity_score: 75, category: 'jewelry' },
      { keyword: 'smart home devices', search_volume: 15000, competition: 'high', opportunity_score: 65, category: 'electronics' },
      { keyword: 'natural skincare', search_volume: 11000, competition: 'high', opportunity_score: 70, category: 'beauty' }
    ];

    mockKeywords.forEach(keywordData => {
      if (!keywordInsights.find(k => k.keyword === keywordData.keyword)) {
        const insight = new KeywordInsight({
          ...keywordData,
          competitor_using: Math.random() > 0.5,
          suggested_for_images: Math.floor(Math.random() * 10) + 1
        });
        keywordInsights.push(insight);
      }
    });
  }
}
