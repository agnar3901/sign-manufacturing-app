const { authDB } = require('../lib/auth-db');

async function initAdmin() {
  try {
    await authDB.createDefaultAdmin();
    console.log('✅ Admin initialization completed!');
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
}

initAdmin(); 