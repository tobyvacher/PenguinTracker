import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function AuthDebugger() {
  const [status, setStatus] = useState<string>("Not started");
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const checkFirebaseConfig = () => {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const appId = import.meta.env.VITE_FIREBASE_APP_ID;

    setStatus(`Checking Firebase config...
Api Key: ${apiKey ? "Present" : "Missing"}
Project ID: ${projectId ? "Present" : "Missing"}
App ID: ${appId ? "Present" : "Missing"}`);

    return !!apiKey && !!projectId && !!appId;
  };

  const testSignIn = async () => {
    setStatus("Starting authentication test...");
    setError(null);
    setUser(null);

    if (!checkFirebaseConfig()) {
      setError("Firebase configuration is missing one or more required values");
      return;
    }

    try {
      setStatus("Initializing Firebase...");
      // Create a new Firebase instance just for this test
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };

      const testApp = initializeApp(firebaseConfig, "authTest");
      const testAuth = getAuth(testApp);
      const provider = new GoogleAuthProvider();
      
      // Add scopes for better user experience
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({ prompt: 'select_account' });

      setStatus("Firebase initialized, launching sign-in popup...");
      const result = await signInWithPopup(testAuth, provider);
      
      setStatus("Sign-in successful!");
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
      });
    } catch (err: any) {
      setStatus("Sign-in failed");
      setError(`Error: ${err.code || 'unknown'} - ${err.message || 'No message'}`);
      
      if (err.code === 'auth/unauthorized-domain') {
        setError(`ERROR: Your domain (${window.location.hostname}) is not authorized in Firebase.
        
Go to Firebase Console > Authentication > Settings > Authorized domains and add: ${window.location.hostname}`);
      }
    }
  };

  return (
    <Card className="max-w-md mx-auto my-4">
      <CardHeader>
        <CardTitle>Authentication Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testSignIn} className="w-full">
          Test Google Sign-In
        </Button>
        
        <div className="p-2 bg-gray-100 rounded-md text-sm">
          <p className="font-semibold">Status:</p>
          <pre className="whitespace-pre-wrap">{status}</pre>
        </div>
        
        {error && (
          <div className="p-2 bg-red-50 text-red-900 rounded-md text-sm">
            <p className="font-semibold">Error:</p>
            <pre className="whitespace-pre-wrap">{error}</pre>
          </div>
        )}
        
        {user && (
          <div className="p-2 bg-green-50 text-green-900 rounded-md text-sm">
            <p className="font-semibold">User Info:</p>
            <pre className="whitespace-pre-wrap">{JSON.stringify(user, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}