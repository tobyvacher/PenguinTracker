import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase-admin';

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string | null;
        name?: string | null;
        picture?: string | null;
      };
    }
  }
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Allow unauthenticated users to proceed (guest mode)
    return next();
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Add the user details to the request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      name: decodedToken.name || null,
      picture: null // Use proper user picture handling when needed
    };
    
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    // Allow the request to proceed even if the token is invalid (guest mode)
    next();
  }
};

// Check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};