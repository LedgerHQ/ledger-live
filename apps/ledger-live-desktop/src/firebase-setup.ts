import { FirebaseOptions } from "firebase/app";

const DEVELOPMENT_FIREBASE_CONFIG: FirebaseOptions = {
  apiKey: "AIzaSyDh7WKaA5cvXV1C554Djyd68vy_1LrXxhk",
  authDomain: "ledger-live-development.firebaseapp.com",
  projectId: "ledger-live-development",
  storageBucket: "ledger-live-development.appspot.com",
  messagingSenderId: "750497694072",
  appId: "1:750497694072:web:d2fc719100b45405bac88d",
};

const CONTENT_AB_TESTS_FIREBASE_CONFIG: FirebaseOptions = {
  apiKey: "AIzaSyCqqnv4kKyCJHLBeuSxPYUwFl7uj2q6CnA",
  authDomain: "content-ab-tests-lw.firebaseapp.com",
  projectId: "content-ab-tests-lw",
  storageBucket: "content-ab-tests-lw.firebasestorage.app",
  messagingSenderId: "18050006528",
  appId: "1:18050006528:web:37d3088790d7ce42eae2e5",
};

export function getFirebaseConfig(): FirebaseOptions {
  if (process.env.FIREBASE_API_KEY) {
    return {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };
  }
  return DEVELOPMENT_FIREBASE_CONFIG;
}

export function getContentAbTestsFirebaseConfig(): FirebaseOptions {
  if (process.env.CONTENT_AB_TESTS_FIREBASE_API_KEY) {
    return {
      apiKey: process.env.CONTENT_AB_TESTS_FIREBASE_API_KEY,
      authDomain: process.env.CONTENT_AB_TESTS_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.CONTENT_AB_TESTS_FIREBASE_PROJECT_ID,
      storageBucket: process.env.CONTENT_AB_TESTS_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.CONTENT_AB_TESTS_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.CONTENT_AB_TESTS_FIREBASE_APP_ID,
    };
  }
  return CONTENT_AB_TESTS_FIREBASE_CONFIG;
}
