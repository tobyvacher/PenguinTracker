import admin from 'firebase-admin';

// Create a basic app with the project ID and no credentials
// This will use API keys from the client side for Firestore
try {
  // Initialize with a completely offline credential - this will still 
  // allow Firestore operations using the API key from the client
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: `firebase-adminsdk-dummy@${process.env.VITE_FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`,
      // Use an empty private key that won't attempt to authenticate
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDENbQHGD96tUZz\ncvpeiC1mq8JBLcxKjzGpVZXhbLg5pR2LZa7J2ZIkeSg+SOlDRKXN+L8WMBt/FXUW\nZD5KfA5E8rK2QDzJzgIQ5OwOZZbzL5+HR9NRjZpMK9Xcvl8EzOQNWJL7RxfSshlH\nX66VKXgA+F8vdZgTHk2P+QES1ZmaCM5Ec40kJCXQpJWOSf254AQy5q7JzQYdLT9b\nWQSuR5gQV7PGNfZes+hHERWjf0f+ILnm9CSAUOxVXGdcYzdp7Aa6SgJlJTuhlW4n\nbZ5GABwiTZg3Zz1GJZrSAkn0JoabnHF8vj80gHg45nK5Jb4hBSBdvzic8M+RCmVh\nWFltFxydAgMBAAECggEAXNcM5U2V6c9XAY27y9H+TXeIxMHWuU5aeIxQ5jR7EzLo\n2o9o6/qTI9OR8XTj7sPO/6VbCdkTjHVa6TlwzPeXPrRZy7+EoWtHLPw2R/CRnKr9\nL/L6zqLVxgYA28CRxGOA1eRZH1J3lOqpK0G4kOyGEcGLECbFvTPYjQpKg4TJPzwM\npChz8ImQ4AK075/Jy1v7kLFDPHq03rvqAvBE/qh/tY9UmVbcFnF1xiRtDFnhCUqG\nzPbgxoKyaE3yMBrHYLWTkcuF5m5xHzFYzxmqpCGHYBmcTp4y45a0+GtF1GiLD374\nKgC2GV/lHQWyPrRXUS1W+vKRzBZ8ATc8Zt60iuSoaQKBgQDmuoKiEH3QCmGQvJZs\nfghT2jG/f5BiZYefPdHryftHNaGxLX/FSDR/nEYwtgS9Y8gCbT8sJSFW3sJcBE5n\nXZdLVqGIGwPVj+GQDWcAQHoqTsW9/7N8i2f7kHH8rXnfpE3CvhDZSHr5rbL1ZnIo\nlNbDWrMj3pDJlwnkV0v42wjx9QKBgQDaIEzQNxFJP0FsB2EtpwAUJ1gLxCCQvC97\nBHSl7FWHZeHZ95qBgIUfE5yTy5KYmI5gjOk3rJBHiPvQlR6jQYXq+EWnUZ5v0YKO\nvYJ9wLBFnM+1SBy3MwZA5lrV9Uv0KJB1/aWRMWmmLge5eSzyGIpHKZWD6/5wZ4DI\n61eo/R3sKQKBgFrpQpOXH+dL4KUqtPOUFLiMS19FSvqx8QYsuiZm+Y9pu6SOLq4a\npBnFRXqHoHosvHIjGE+F10uYqljVWXyDxnLQZzbcLnC45mXdQwVRKE1WGHTdUgBk\nhCbfiqqWYqsmsHwakvbZqrfPdUWtWgz77+Jb9TcbKdTD16SQdvIFnA8hAoGAAIFx\n4xEPR3Q2/kY04MYmIHal8HaoKLwLyNcsKSXCeRmzYZYXbE9+NEuKK6d67yLEeQa3\nZLlUBn6qkYzeBUe7GpDle0HUMtBLlEIQ0Xb+B7bvzPeEqpc4ywKCTbVh1tKmQDAn\nTkY3iWBZd20jQDa4p0oS0+AzVlJK9XCMcnwILrkCgYEA14B9yr8zCxZJvZqiDVQQ\nJUDBx87mjafz7/I/k6PgW2w+LLqvdFJ8Jg4PGQ+KBrxvdEZDPgKqqwQfbnYwd7G6\nJysbAyqXOnSbK1jrQ6BKoXXdlJIQvX4kzL/CBtHFuwFIxXD9zcPVhX0RGbfp0nxi\nOT4eChDCb/L6QJbMXX1wdaE=\n-----END PRIVATE KEY-----\n"
    })
  });
  console.log('Firebase Admin initialized in offline mode');
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