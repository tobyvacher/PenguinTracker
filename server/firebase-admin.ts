import admin from 'firebase-admin';

// Initialize Firebase Admin with service account credentials
try {
  // Parse the service account JSON from environment variable
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });
  console.log('Firebase Admin initialized successfully with service account');
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

// Export Firestore database instance for server-side access
const db = admin.firestore ? admin.firestore() : null;

export { auth, db };