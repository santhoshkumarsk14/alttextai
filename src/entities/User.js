// Mock data storage - in a real app, this would connect to a database
let users = [];
let currentUser = null;

export class User {
  constructor(data) {
    this.id = data.id || 1;
    this.email = data.email;
    this.name = data.name || 'Store Owner';
    this.avatar = data.avatar || null;
    this.role = data.role || 'owner';
    this.subscription_tier = data.subscription_tier || 'growth';
    this.created_date = data.created_date || new Date().toISOString();
    this.last_login = data.last_login || new Date().toISOString();
  }

  static async me() {
    if (!currentUser) {
      currentUser = new User({
        id: 1,
        email: 'owner@store.com',
        name: 'Store Owner',
        role: 'owner',
        subscription_tier: 'growth'
      });
    }
    return currentUser;
  }

  static async update(data) {
    if (currentUser) {
      currentUser = { ...currentUser, ...data };
    }
    return currentUser;
  }

  static async getProfile() {
    const user = await User.me();
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      subscription_tier: user.subscription_tier,
      created_date: user.created_date,
      last_login: user.last_login
    };
  }
}
