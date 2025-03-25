import admin from 'firebase-admin';

// For development purposes, use a service account or a default app
try {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  
  // In development or test environments, continue without full Firebase Admin
  console.log('Continuing without full Firebase Admin authentication');
}

// Create a mock auth for development if real auth isn't available
const auth = admin.auth ? admin.auth() : {
  // Mock implementation for development
  verifyIdToken: async () => ({
    uid: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
  }),
};

export { auth };