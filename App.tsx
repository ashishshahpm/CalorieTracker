import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LogEntry, UserGoals, DailyStats, User } from './types';
import { NutritionSummary } from './components/NutritionSummary';
import { LogComposer } from './components/LogComposer';
import { LogFeed } from './components/LogFeed';
import { DateNavigator } from './components/DateNavigator';
import { SettingsDrawer } from './components/SettingsDrawer';
import { apiService } from './apiService';

const toLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const GOOGLE_CLIENT_ID = "457380672728-fchuij5r2l04a87tmbjuunv8adalc9ds.apps.googleusercontent.com";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(toLocalDateString(new Date()));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [goals, setGoals] = useState<UserGoals>({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 70,
    fiber: 30
  });

  const hasLoadedFromServer = useRef(false);

  // 1. App Boot: Restore session and load local cache IMMEDIATELY
  useEffect(() => {
    console.log("[App] Booting...");
    const savedUser = localStorage.getItem('calorietracker_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        console.log("[App] Session detected for:", parsed.email);
        setUser(parsed);
        
        // Recover previous logs for this user immediately while background sync prepares
        const cachedLogs = localStorage.getItem(`server_logs_${parsed.email}`);
        const cachedGoals = localStorage.getItem(`server_goals_${parsed.email}`);
        if (cachedLogs) {
          const parsedLogs = JSON.parse(cachedLogs);
          setLogs(parsedLogs);
          console.log(`[App] Pre-loaded ${parsedLogs.length} logs from cache.`);
        }
        if (cachedGoals) setGoals(JSON.parse(cachedGoals));
      } catch (e) {
        console.error("[App] Cache boot failed:", e);
      }
    }
  }, []);

  // 2. Auth handling (GSI)
  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      console.log("[App] Received Google Credential.");
      console.time("⏱️ Auth Flow: Full Cycle");
      try {
        const firebaseResult = await apiService.signInWithGoogle(response.credential);
        if (firebaseResult) {
          const { user: fbUser } = firebaseResult;
          const userData: User = {
            name: fbUser.displayName || "User",
            email: fbUser.email || "",
            picture: fbUser.photoURL || ""
          };
          
          // Pre-load cache for this specific email before setting user
          const cachedLogs = localStorage.getItem(`server_logs_${userData.email}`);
          if (cachedLogs) setLogs(JSON.parse(cachedLogs));
          
          localStorage.setItem('calorietracker_user', JSON.stringify(userData));
          setUser(userData);
          console.timeEnd("⏱️ Auth Flow: Full Cycle");
        }
      } catch (e: any) {
        console.timeEnd("⏱️ Auth Flow: Full Cycle");
        console.error("[App] Auth error details:", e);
        alert(`Sign-in error: ${e.message}`);
      }
    };

    const initGSI = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          ux_mode: 'popup',
        });
        const loginBtn = document.getElementById('google-login-btn');
        if (loginBtn) {
          google.accounts.id.renderButton(loginBtn, { 
            theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: 280
          });
        }
      } else {
        setTimeout(initGSI, 100);
      }
    };

    if (!user) initGSI();
  }, [user]);

  // 3. Server Sync: Fetch records
  useEffect(() => {
    const fetchServerData = async () => {
      if (!user || user.email === 'guest@local') return;
      
      // ONLY show the loading screen if we have zero logs.
      // If we have cached logs, we let the user see them while we update in the background.
      const hasCachedData = logs.length > 0;
      if (!hasCachedData) setIsInitialLoading(true);
      
      console.group("[App] Sync Profiling");
      console.time("⏱️ Sync Sequence: Total");
      const startTime = performance.now();
      
      const FETCH_TIMEOUT = 15000;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Server timed out after ${FETCH_TIMEOUT/1000}s`)), FETCH_TIMEOUT)
      );

      try {
        console.log("[App] Fetching latest from Firestore...");
        const [serverLogs, serverGoals] = await Promise.race([
          Promise.all([
            apiService.fetchLogs(user.email),
            apiService.fetchGoals(user.email)
          ]),
          timeoutPromise
        ]) as [LogEntry[], UserGoals | null];

        const duration = (performance.now() - startTime).toFixed(0);
        console.info(`[App] Sync SUCCESS. Server returned ${serverLogs.length} items. Time: ${duration}ms`);
        console.timeEnd("⏱️ Sync Sequence: Total");
        
        setLogs(serverLogs);
        if (serverGoals) setGoals(serverGoals);
        hasLoadedFromServer.current = true;
      } catch (error) {
        const duration = (performance.now() - startTime).toFixed(0);
        console.warn(`[App] Sync FAILED/SLOW (${duration}ms). Using local/cached state.`, error);
        console.timeEnd("⏱️ Sync Sequence: Total");
        // Mark as loaded so subsequent edits still try to sync up
        hasLoadedFromServer.current = true;
      } finally {
        setIsInitialLoading(false);
        console.groupEnd();
      }
    };
    fetchServerData();
  }, [user?.email]);

  // 4. Background Sync: Push local changes
  useEffect(() => {
    const syncToServer = async () => {
      if (!user || !hasLoadedFromServer.current || user.email === 'guest@local') return;
      
      setIsSyncing(true);
      try {
        await Promise.all([
          apiService.saveLogs(user.email, logs),
          apiService.saveGoals(user.email, goals)
        ]);
      } catch (e) {
        console.error("[App] Cloud push failed:", e);
      } finally {
        setIsSyncing(false);
      }
    };

    const timeout = setTimeout(syncToServer, 2000);
    return () => clearTimeout(timeout);
  }, [logs, goals, user?.email]);

  const dailyLogs = useMemo(() => {
    return logs
      .filter(log => log.date === selectedDate)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [logs, selectedDate]);

  const dailyStats = useMemo<DailyStats>(() => {
    return dailyLogs.reduce((acc, log) => {
      log.items.forEach(item => {
        acc.calories += (item.calories || 0);
        acc.protein += (item.protein || 0);
        acc.carbs += (item.carbs || 0);
        acc.fat += (item.fat || 0);
        acc.fiber += (item.fiber || 0);
      });
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  }, [dailyLogs]);

  const handleAddLog = useCallback((entry: LogEntry) => {
    setLogs(prev => [entry, ...prev]);
  }, []);

  const handleDeleteLog = async (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
    if (user && user.email !== 'guest@local') {
      await apiService.deleteLog(user.email, id);
    }
  };

  const handleUpdateLog = (updatedEntry: LogEntry) => {
    setLogs(prev => prev.map(l => l.id === updatedEntry.id ? updatedEntry : l));
  };

  const handleGuestLogin = () => {
    const guestUser: User = {
      name: "Guest User",
      email: "guest@local",
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"
    };
    localStorage.setItem('calorietracker_user', JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const handleLogout = async () => {
    console.log("[App] Logging out...");
    await apiService.signOut();
    setUser(null);
    setLogs([]);
    hasLoadedFromServer.current = false;
    localStorage.removeItem('calorietracker_user');
    setIsSettingsOpen(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white text-4xl shadow-xl mx-auto mb-6">
            <i className="fa-solid fa-utensils"></i>
          </div>
          <h1 className="text-4xl font-black text-emerald-900 mb-2">CalorieTracker</h1>
          <p className="text-emerald-700/60 font-medium max-w-xs mx-auto">Track your nutrition with AI.</p>
        </div>
        
        <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-sm space-y-6">
          <div className="space-y-4">
            <div id="google-login-btn" className="flex justify-center min-h-[50px]"></div>
            
            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-gray-100 flex-1"></div>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Or</span>
              <div className="h-px bg-gray-100 flex-1"></div>
            </div>

            <button 
              onClick={handleGuestLogin}
              className="w-full py-3.5 px-6 bg-white border-2 border-emerald-50 text-emerald-600 font-bold rounded-full hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
            >
              <i className="fa-solid fa-user-secret"></i>
              Continue as Guest
              <span className="text-[8px] bg-emerald-100 px-1.5 py-0.5 rounded uppercase ml-1">Offline</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto shadow-xl relative">
      {isInitialLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
          <p className="text-emerald-900 font-black tracking-tighter text-xl animate-pulse">Checking records...</p>
          <p className="text-emerald-500/50 text-[10px] uppercase font-bold mt-2 tracking-widest">Warming up connection</p>
        </div>
      )}

      <header className="bg-white border-b px-6 py-4 sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-emerald-600 flex items-center gap-2 tracking-tighter">
            <i className="fa-solid fa-utensils"></i> CalorieTracker
          </h1>
          <div className="flex items-center gap-1.5">
            {isSyncing ? (
              <i className="fa-solid fa-cloud-arrow-up text-blue-400 text-[10px] animate-pulse"></i>
            ) : (
              <i className={`fa-solid ${user?.email === 'guest@local' ? 'fa-hard-drive text-gray-400' : 'fa-cloud-check text-emerald-400'} text-[10px]`}></i>
            )}
          </div>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="active:scale-90 transition-transform">
          <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border-2 border-emerald-100 shadow-sm" />
        </button>
      </header>

      <main className="flex-1 pb-40">
        <DateNavigator selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        <div className="p-4 space-y-6">
          <NutritionSummary stats={dailyStats} goals={goals} />
          <div>
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-2">Daily Journal</h2>
            <LogFeed entries={dailyLogs} onDelete={handleDeleteLog} onUpdate={handleUpdateLog} />
          </div>
        </div>
      </main>

      <LogComposer onLogAdded={handleAddLog} selectedDate={selectedDate} />

      <SettingsDrawer 
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} 
        goals={goals} onUpdateGoals={setGoals} user={user} onLogout={handleLogout}
      />
    </div>
  );
};

export default App;