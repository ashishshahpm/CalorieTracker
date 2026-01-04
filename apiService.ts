
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  writeBatch,
  deleteDoc,
  Firestore
} from 'firebase/firestore';
// Split named imports for values and types to ensure compatibility across TypeScript versions
import { getAuth, GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { LogEntry, UserGoals } from './types';

/**
 * FIREBASE CONFIG
 */
const firebaseConfig = {
  apiKey: "AIzaSyDAjjRTOZjZcQisYzpbemx3UL7jiaz02a4",
  authDomain: "calorietrackerpersonal.firebaseapp.com",
  projectId: "calorietrackerpersonal",
  storageBucket: "calorietrackerpersonal.firebasestorage.app",
  messagingSenderId: "457380672728",
  appId: "1:457380672728:web:0bcb557c6212d0e512d3ad",
  measurementId: "G-YL47JEBVMG"
};

/**
 * Utility to remove 'undefined' values from objects.
 * Firestore throws errors if it encounters 'undefined'.
 */
const sanitizeData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(v => sanitizeData(v));
  } else if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitizeData(v)])
    );
  }
  return data;
};

// Internal state
let app: FirebaseApp;
let db: Firestore | null = null;
let auth: Auth | null = null;

const getFirebase = () => {
  if (!app) {
    const isConfigValid = !!(firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_FIREBASE_API_KEY"));
    if (!isConfigValid) {
      console.warn("[Firebase] Missing valid API Key. App will run in local-only mode.");
      return { db: null, auth: null };
    }
    
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      console.log("[Firebase] Successfully initialized Services.");
    } catch (e) {
      console.error("[Firebase] Service initialization error:", e);
    }
  }
  return { db, auth };
};

// Eagerly initialize
getFirebase();

export const apiService = {
  async signInWithGoogle(idToken: string) {
    const { auth: currentAuth } = getFirebase();
    if (!currentAuth) throw new Error("Auth service unavailable.");

    try {
      const credential = GoogleAuthProvider.credential(idToken);
      return await signInWithCredential(currentAuth, credential);
    } catch (error) {
      console.error("[Firebase] Auth Error:", error);
      throw error;
    }
  },

  async fetchLogs(email: string): Promise<LogEntry[]> {
    const { db: currentDb } = getFirebase();
    if (!currentDb) {
      const data = localStorage.getItem(`server_logs_${email}`);
      return data ? JSON.parse(data) : [];
    }
    try {
      const logsRef = collection(currentDb, 'users', email, 'logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const logs: LogEntry[] = [];
      querySnapshot.forEach((doc) => logs.push(doc.data() as LogEntry));
      return logs;
    } catch (error) {
      console.error("[Firebase] Fetch logs error", error);
      const data = localStorage.getItem(`server_logs_${email}`);
      return data ? JSON.parse(data) : [];
    }
  },

  async saveLogs(email: string, logs: LogEntry[]): Promise<void> {
    const { db: currentDb } = getFirebase();
    if (!currentDb) {
      localStorage.setItem(`server_logs_${email}`, JSON.stringify(logs));
      return;
    }
    try {
      const batch = writeBatch(currentDb);
      logs.forEach(log => {
        const logRef = doc(currentDb, 'users', email, 'logs', log.id);
        // Sanitize the log object to remove 'undefined' fields
        batch.set(logRef, sanitizeData(log));
      });
      await batch.commit();
    } catch (error) {
      console.error("[Firebase] Save logs error", error);
      localStorage.setItem(`server_logs_${email}`, JSON.stringify(logs));
    }
  },

  async deleteLog(email: string, logId: string): Promise<void> {
    const { db: currentDb } = getFirebase();
    if (!currentDb) return;
    try {
      await deleteDoc(doc(currentDb, 'users', email, 'logs', logId));
    } catch (error) {
      console.error("[Firebase] Delete log error", error);
    }
  },

  async fetchGoals(email: string): Promise<UserGoals | null> {
    const { db: currentDb } = getFirebase();
    if (!currentDb) {
      const data = localStorage.getItem(`server_goals_${email}`);
      return data ? JSON.parse(data) : null;
    }
    try {
      const goalRef = doc(currentDb, 'users', email, 'config', 'goals');
      const docSnap = await getDoc(goalRef);
      return docSnap.exists() ? docSnap.data() as UserGoals : null;
    } catch (error) {
      console.error("[Firebase] Fetch goals error", error);
      return null;
    }
  },

  async saveGoals(email: string, goals: UserGoals): Promise<void> {
    const { db: currentDb } = getFirebase();
    if (!currentDb) {
      localStorage.setItem(`server_goals_${email}`, JSON.stringify(goals));
      return;
    }
    try {
      const goalRef = doc(currentDb, 'users', email, 'config', 'goals');
      // Sanitize goals object
      await setDoc(goalRef, sanitizeData(goals));
    } catch (error) {
      console.error("[Firebase] Save goals error", error);
    }
  },

  async signOut() {
    const { auth: currentAuth } = getFirebase();
    if (currentAuth) {
      try {
        await signOut(currentAuth);
      } catch (error) {
        console.error("[Firebase] Sign-out error", error);
      }
    }
  }
};
