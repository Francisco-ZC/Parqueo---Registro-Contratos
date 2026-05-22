// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';

// Import the specific services you need (authentication and storage (BD))
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Red contection auth in .env.local
// import.meta.env es la forma de Vite de acceder a variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// inicialize firebase with credentials
const app = initializeApp(firebaseConfig);

// Export auth and db to be used elsewhere
// auth = sistema de usuarios (login, logout, sesión)
// db = Firestore (la base de datos)
export const auth = getAuth(app);
export const db = getFirestore(app);