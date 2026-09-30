import rawConfig from "../../firebase-applet-config.json";

export interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

export const firebaseConfig: FirebaseAppletConfig = {
  ...rawConfig,
  // API key comes from the VITE_FIREBASE_API_KEY env var (never committed).
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey,
};
