// Images API service for communicating with the backend
const API_BASE_URL = '/api';

export const imagesApi = {
  // Get all images for the current user
  async getAll(sortBy = '-created_date') {
    try {
      const response = await fetch(`${API_BASE_URL}/images?sort=${sortBy}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth token if available
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.images : [];
    } catch (error) {
      console.error('Error fetching images:', error);
      return [];
    }
  },

  // Get image by ID
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/images/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.image : null;
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
  },

  // Update image
  async update(id, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/images/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.image : null;
    } catch (error) {
      console.error('Error updating image:', error);
      throw error;
    }
  },

  // Delete image
  async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/images/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  // Bulk update images
  async bulkUpdate(ids, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/images/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ ids, updates })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.images : [];
    } catch (error) {
      console.error('Error bulk updating images:', error);
      throw error;
    }
  },

  // Get image statistics
  async getStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/images/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.stats : null;
    } catch (error) {
      console.error('Error fetching image stats:', error);
      return null;
    }
  }
};