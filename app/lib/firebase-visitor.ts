// Firebase config shared with swiftmove-L dashboard
// Both projects use the SAME Firebase project (swiftmove-l)
// so visitor data flows directly into the dashboard

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const FIREBASE_APP_NAME = "swiftmove-visitor";

const firebaseConfig = {
  apiKey: "AIzaSyCerXqJkAvH4JkXkD0Ut09TZyrHCe2kJHs",
  authDomain: "swiftmove-l.firebaseapp.com",
  databaseURL: "https://swiftmove-l-default-rtdb.firebaseio.com",
  projectId: "swiftmove-l",
  storageBucket: "swiftmove-l.firebasestorage.app",
  messagingSenderId: "742722534350",
  appId: "1:742722534350:web:b0c756c2d8a62d592dc99f",
};

const existingApp = getApps().find((a) => a.name === FIREBASE_APP_NAME);
export const visitorFirebaseApp = existingApp ?? initializeApp(firebaseConfig, FIREBASE_APP_NAME);
export const visitorDb = getFirestore(visitorFirebaseApp);
export const visitorRtdb = getDatabase(visitorFirebaseApp);
