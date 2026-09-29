import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  calendarGoogleProvider,
  testFirestoreConnection,
  setCachedAccessToken,
  getCachedAccessToken,
} from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  hasCalendarAccess: boolean;
  signInWithGoogle: () => Promise<string | null>;
  requestCalendarAccess: () => Promise<string | null>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  accessToken: null,
  hasCalendarAccess: false,
  signInWithGoogle: async () => null,
  requestCalendarAccess: async () => null,
  signOut: async () => {},
  error: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(() => getCachedAccessToken());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        if (!currentUser) {
          setCachedAccessToken(null);
          setAccessToken(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Auth state error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (token) {
        setCachedAccessToken(token);
        setAccessToken(token);
      }
      return token;
    } catch (err: any) {
      console.error("Google Sign In Error:", err);
      if (err.code === "auth/unauthorized-domain") {
        const domain = typeof window !== "undefined" ? window.location.hostname : "this domain";
        const msg = `Unauthorized Domain: Please add "${domain}" to your Firebase Console under Authentication > Settings > Authorized domains.`;
        setError(msg);
        alert(msg);
        return null;
      }
      if (err.code === "auth/popup-blocked") {
        const msg = "Sign-in popup was blocked by your browser. Please allow popups or open in a direct tab.";
        setError(msg);
        alert(msg);
        return null;
      }
      if (err.code === "auth/cancelled-popup-request" || err.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed.");
        return null;
      }
      setError(err.message || "Failed to authenticate with Google.");
      return null;
    }
  };

  const requestCalendarAccess = async (): Promise<string | null> => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, calendarGoogleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (token) {
        setCachedAccessToken(token);
        setAccessToken(token);
      }
      return token;
    } catch (err: any) {
      console.error("Google Calendar Access Error:", err);
      setError(err.message || "Failed to grant Google Calendar access.");
      return null;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await fbSignOut(auth);
      setCachedAccessToken(null);
      setAccessToken(null);
    } catch (err: any) {
      console.error("Sign Out Error:", err);
      setError(err.message || "Failed to sign out.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        hasCalendarAccess: !!accessToken,
        signInWithGoogle,
        requestCalendarAccess,
        signOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
