// Mock data storage - in a real app, this would connect to a database
let performanceReports = [];
let nextId = 1;

export class PerformanceReport {
  constructor(data) {
    this.id = data.id || nextId++;
    this.report_date = data.report_date;
    this.total_images = data.total_images || 0;
    this.ada_compliant_images = data.ada_compliant_images || 0;
    this.avg_seo_score = data.avg_seo_score || 0;
    this.organic_traffic_increase = data.organic_traffic_increase || 0;
    this.image_search_impressions = data.image_search_impressions || 0;
    this.image_search_clicks = data.image_search_clicks || 0;
    this.top_performing_keywords = data.top_performing_keywords || [];
    this.keyword_rank_improvements = data.keyword_rank_improvements || 0;
    this.time_saved_hours = data.time_saved_hours || 0;
    this.created_date = data.created_date || new Date().toISOString();
  }

  static async create(data) {
    const report = new PerformanceReport(data);
    performanceReports.push(report);
    return report;
  }

  static async list(sortBy = '-report_date', limit = null) {
    let sortedReports = [...performanceReports];
    
    if (sortBy.startsWith('-')) {
      const field = sortBy.substring(1);
      sortedReports.sort((a, b) => {
        if (field === 'report_date') {
          return new Date(b[field]) - new Date(a[field]);
        }
        return b[field] - a[field];
      });
    } else {
      sortedReports.sort((a, b) => {
        if (sortBy === 'report_date') {
          return new Date(a[sortBy]) - new Date(b[sortBy]);
        }
        return a[sortBy] - b[sortBy];
      });
    }
    
    if (limit) {
      sortedReports = sortedReports.slice(0, limit);
    }
    
    return sortedReports;
  }

  static async findById(id) {
    return performanceReports.find(report => report.id === parseInt(id));
  }

  static async findByDate(date) {
    return performanceReports.find(report => report.report_date === date);
  }

  static async getLatest() {
    return performanceReports.length > 0 ? performanceReports[0] : null;
  }

  static async getTrends(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return performanceReports
      .filter(report => new Date(report.report_date) >= cutoffDate)
      .sort((a, b) => new Date(a.report_date) - new Date(b.report_date));
  }

  static async getSummary() {
    if (performanceReports.length === 0) {
      return {
        totalReports: 0,
        avgTrafficIncrease: 0,
        avgSEOScore: 0,
        totalTimeSaved: 0,
        totalImpressions: 0
      };
    }

    const totalReports = performanceReports.length;
    const avgTrafficIncrease = performanceReports.reduce((sum, r) => sum + r.organic_traffic_increase, 0) / totalReports;
    const avgSEOScore = performanceReports.reduce((sum, r) => sum + r.avg_seo_score, 0) / totalReports;
    const totalTimeSaved = performanceReports.reduce((sum, r) => sum + r.time_saved_hours, 0);
    const totalImpressions = performanceReports.reduce((sum, r) => sum + r.image_search_impressions, 0);

    return {
      totalReports,
      avgTrafficIncrease,
      avgSEOScore,
      totalTimeSaved,
      totalImpressions
    };
  }
}
