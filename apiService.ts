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
  Firestore,
  onSnapshotsInSync,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { LogEntry, UserGoals } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyDAjjRTOZjZcQisYzpbemx3UL7jiaz02a4",
  authDomain: "calorietrackerpersonal.firebaseapp.com",
  projectId: "calorietrackerpersonal",
  storageBucket: "calorietrackerpersonal.firebasestorage.app",
  messagingSenderId: "457380672728",
  appId: "1:457380672728:web:0bcb557c6212d0e512d3ad",
  measurementId: "G-YL47JEBVMG"
};

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

let app: FirebaseApp;
let db: Firestore | null = null;
let auth: Auth | null = null;

const getFirebase = () => {
  if (!app) {
    try {
      console.time("[Firebase] Total Init Time");
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      console.timeEnd("[Firebase] Total Init Time");
      
      onSnapshotsInSync(db, () => {
        console.log("[Firebase] Local state is synchronized with server.");
      });
    } catch (e) {
      console.error("[Firebase] Initialization failed. Check your config or internet connection.", e);
    }
  }
  return { db, auth };
};

export const apiService = {
  async signInWithGoogle(idToken: string) {
    console.time("⏱️ Auth Flow");
    const { auth: currentAuth } = getFirebase();
    if (!currentAuth) throw new Error("Firebase Auth not initialized.");
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(currentAuth, credential);
      console.info("[Auth] Success:", result.user.email);
      console.timeEnd("⏱️ Auth Flow");
      return result;
    } catch (error) {
      console.timeEnd("⏱️ Auth Flow");
      throw error;
    }
  },

  async fetchLogs(email: string): Promise<LogEntry[]> {
    console.time(`⏱️ Firestore Fetch: ${email}`);
    const { db: currentDb } = getFirebase();
    
    if (!currentDb) {
      const data = localStorage.getItem(`server_logs_${email}`);
      return data ? JSON.parse(data) : [];
    }

    try {
      const logsRef = collection(currentDb, 'users', email, 'logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'));
      
      // If the database doesn't exist, this line hangs until timeout
      const querySnapshot = await getDocs(q);
      
      const logs: LogEntry[] = [];
      querySnapshot.forEach((doc) => logs.push(doc.data() as LogEntry));
      
      console.info(`[Firebase] Downloaded ${logs.length} logs.`);
      localStorage.setItem(`server_logs_${email}`, JSON.stringify(logs));
      console.timeEnd(`⏱️ Firestore Fetch: ${email}`);
      return logs;
    } catch (error: any) {
      console.error("[Firebase] Fetch Error. Did you click 'Create Database' in Firebase Console?", error);
      console.timeEnd(`⏱️ Firestore Fetch: ${email}`);
      const data = localStorage.getItem(`server_logs_${email}`);
      return data ? JSON.parse(data) : [];
    }
  },

  async saveLogs(email: string, logs: LogEntry[]): Promise<void> {
    localStorage.setItem(`server_logs_${email}`, JSON.stringify(logs));
    const { db: currentDb } = getFirebase();
    if (!currentDb) return;

    try {
      console.group(`[Firebase] Syncing users/${email}/logs...`);
      const batch = writeBatch(currentDb);
      logs.slice(0, 450).forEach(log => {
        const logRef = doc(currentDb, 'users', email, 'logs', log.id);
        batch.set(logRef, sanitizeData(log));
      });

      await batch.commit();
      console.info("[Firebase] Cloud write confirmed.");
      console.groupEnd();
    } catch (error) {
      console.error("[Firebase] Save Error. Check Firestore Rules/Existence.", error);
      console.groupEnd();
    }
  },

  async deleteLog(email: string, logId: string): Promise<void> {
    const { db: currentDb } = getFirebase();
    if (!currentDb) return;
    try {
      await deleteDoc(doc(currentDb, 'users', email, 'logs', logId));
      console.info(`[Firebase] Deleted ${logId}`);
    } catch (error) {
      console.error("[Firebase] Delete failed:", error);
    }
  },

  async fetchGoals(email: string): Promise<UserGoals | null> {
    const { db: currentDb } = getFirebase();
    if (!currentDb) return null;
    try {
      const goalRef = doc(currentDb, 'users', email, 'config', 'goals');
      const docSnap = await getDoc(goalRef);
      if (docSnap.exists()) {
        const goals = docSnap.data() as UserGoals;
        localStorage.setItem(`server_goals_${email}`, JSON.stringify(goals));
        return goals;
      }
      return null;
    } catch (error) {
      console.error("[Firebase] Goals fetch error:", error);
      return null;
    }
  },

  async saveGoals(email: string, goals: UserGoals): Promise<void> {
    localStorage.setItem(`server_goals_${email}`, JSON.stringify(goals));
    const { db: currentDb } = getFirebase();
    if (!currentDb) return;
    try {
      const goalRef = doc(currentDb, 'users', email, 'config', 'goals');
      await setDoc(goalRef, sanitizeData(goals));
      console.info("[Firebase] Goals updated in cloud.");
    } catch (error) {
      console.error("[Firebase] Goals save error:", error);
    }
  },

  async signOut() {
    const { auth: currentAuth } = getFirebase();
    if (currentAuth) {
      try {
        await signOut(currentAuth);
        console.log("[Firebase] Session ended.");
      } catch (error) {
        console.error("[Firebase] Sign-out error:", error);
      }
    }
  }
};