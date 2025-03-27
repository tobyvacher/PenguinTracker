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
  
  // Debug: Display validation information
  const projectId = admin.app().options.projectId;
  console.log(`Firebase Admin initialized with project ID: ${projectId}`);
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

// Debug helper function to check Firestore collections
export async function debugFirestore() {
  if (!db) {
    console.error('DEBUG: Firestore is not initialized!');
    return;
  }
  
  try {
    console.log('DEBUG: Testing Firestore connection...');
    
    // Test if we can write to a test document
    const testRef = db.collection('test_debug').doc('test_doc');
    await testRef.set({
      timestamp: new Date().toISOString(),
      message: 'Test document created by server'
    });
    console.log('DEBUG: Successfully wrote to test document in Firestore');
    
    // Check seen_penguins collection
    console.log('DEBUG: Checking seen_penguins collection');
    const seenPenguinsSnapshot = await db.collection('seen_penguins').get();
    console.log(`DEBUG: seen_penguins collection has ${seenPenguinsSnapshot.size} documents`);
    
    // Print the first few documents
    if (seenPenguinsSnapshot.size > 0) {
      console.log('DEBUG: First few seen_penguins documents:');
      let count = 0;
      seenPenguinsSnapshot.forEach(doc => {
        if (count < 5) {
          console.log(`DEBUG: Document ${doc.id}: ${JSON.stringify(doc.data())}`);
          count++;
        }
      });
    }
    
    return { 
      success: true, 
      message: `Firestore is working. seen_penguins collection has ${seenPenguinsSnapshot.size} documents.`
    };
  } catch (error: any) {
    console.error('DEBUG: Error testing Firestore:', error);
    return { 
      success: false, 
      message: `Firestore test failed: ${error?.message || 'Unknown error'}`
    };
  }
}

export { auth, db };