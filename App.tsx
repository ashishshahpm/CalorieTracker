
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LogEntry, UserGoals, DailyStats, User, FoodItem } from './types';
import { NutritionSummary } from './components/NutritionSummary';
import { LogComposer } from './components/LogComposer';
import { LogFeed } from './components/LogFeed';
import { DateNavigator } from './components/DateNavigator';
import { SettingsDrawer } from './components/SettingsDrawer';
import { apiService } from './apiService';
import { exchangeFitbitCodeForToken, fetchFitbitCalories } from './fitbitService';

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
  const [fitbitCaloriesOut, setFitbitCaloriesOut] = useState<number | null>(null);
  const [fitbitError, setFitbitError] = useState<string | null>(null);
  const [goals, setGoals] = useState<UserGoals>({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 70,
    fiber: 30
  });

  const hasLoadedFromServer = useRef(false);

  // Compute a list of unique past food items for AI consistency memory
  const foodHistory = useMemo(() => {
    const historyMap = new Map<string, Omit<FoodItem, 'id'>>();
    logs.forEach(log => {
      log.items.forEach(item => {
        if (!historyMap.has(item.name.toLowerCase())) {
          historyMap.set(item.name.toLowerCase(), {
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            fiber: item.fiber
          });
        }
      });
    });
    return Array.from(historyMap.values());
  }, [logs]);

  const handleFitbitSync = useCallback(async (token?: string) => {
    const accessToken = token || localStorage.getItem('fitbit_access_token');
    if (!accessToken) return;

    try {
      setFitbitError(null);
      const calories = await fetchFitbitCalories(accessToken, selectedDate);
      setFitbitCaloriesOut(calories);
    } catch (err: any) {
      console.error("Fitbit sync failed:", err);
      setFitbitError(err.message || "Failed to connect to Fitbit. Check your internet or CORS settings.");
      if (err.message?.includes('expired') || err.message?.includes('token')) {
        localStorage.removeItem('fitbit_access_token');
      }
    }
  }, [selectedDate]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fitbitCode = urlParams.get('code');
    if (fitbitCode) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const processFitbitAuth = async () => {
        setIsSyncing(true);
        const token = await exchangeFitbitCodeForToken(fitbitCode);
        if (token) {
          localStorage.setItem('fitbit_access_token', token);
          await handleFitbitSync(token);
        }
        setIsSyncing(false);
      };
      processFitbitAuth();
    } else {
      const existingToken = localStorage.getItem('fitbit_access_token');
      if (existingToken) {
        handleFitbitSync(existingToken);
      }
    }

    const savedUser = localStorage.getItem('calorietracker_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        const cachedLogs = localStorage.getItem(`server_logs_${parsed.email}`);
        const cachedGoals = localStorage.getItem(`server_goals_${parsed.email}`);
        if (cachedLogs) setLogs(JSON.parse(cachedLogs));
        if (cachedGoals) setGoals(JSON.parse(cachedGoals));
      } catch (e) {
        console.error("[App] Cache boot failed:", e);
      }
    }
  }, [selectedDate, handleFitbitSync]);

  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      try {
        const firebaseResult = await apiService.signInWithGoogle(response.credential);
        if (firebaseResult) {
          const { user: fbUser } = firebaseResult;
          const userData: User = {
            name: fbUser.displayName || "User",
            email: fbUser.email || "",
            picture: fbUser.photoURL || ""
          };
          const cachedLogs = localStorage.getItem(`server_logs_${userData.email}`);
          if (cachedLogs) setLogs(JSON.parse(cachedLogs));
          localStorage.setItem('calorietracker_user', JSON.stringify(userData));
          setUser(userData);
        }
      } catch (e: any) {
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
            theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: 240
          });
        }
      } else {
        setTimeout(initGSI, 100);
      }
    };

    if (!user) initGSI();
  }, [user]);

  useEffect(() => {
    const fetchServerData = async () => {
      if (!user || user.email === 'guest@local') return;
      if (logs.length === 0) setIsInitialLoading(true);
      try {
        const [serverLogs, serverGoals] = await Promise.all([
          apiService.fetchLogs(user.email),
          apiService.fetchGoals(user.email)
        ]);
        setLogs(serverLogs);
        if (serverGoals) setGoals(serverGoals);
        hasLoadedFromServer.current = true;
      } catch (error) {
        console.warn(`[App] Sync failed.`, error);
        hasLoadedFromServer.current = true;
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchServerData();
  }, [user?.email]);

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
    await apiService.signOut();
    setUser(null);
    setLogs([]);
    hasLoadedFromServer.current = false;
    localStorage.removeItem('calorietracker_user');
    localStorage.removeItem('fitbit_access_token');
    setIsSettingsOpen(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8 sm:mb-12">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-500 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white text-4xl sm:text-5xl shadow-xl mx-auto mb-6">
            <i className="fa-solid fa-utensils"></i>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-emerald-900 mb-2">CalorieTracker</h1>
          <p className="text-lg sm:text-xl text-emerald-700/60 font-medium max-w-xs mx-auto">Track your nutrition with AI.</p>
        </div>
        <div className="bg-white p-8 sm:p-12 rounded-[40px] sm:rounded-[50px] shadow-xl w-full max-sm:max-w-xs max-w-sm space-y-8 sm:space-y-10 flex flex-col items-center">
          <div className="space-y-6 w-full flex flex-col items-center">
            <div id="google-login-btn" className="flex justify-center min-h-[50px] w-full scale-90 sm:scale-100"></div>
            
            <div className="flex items-center gap-4 py-1 w-full max-w-[240px]">
              <div className="h-px bg-gray-100 flex-1"></div>
              <span className="text-[10px] sm:text-xs font-black text-gray-300 uppercase tracking-widest">Or</span>
              <div className="h-px bg-gray-100 flex-1"></div>
            </div>
            
            <button 
              onClick={handleGuestLogin} 
              className="w-full max-w-[240px] py-3 sm:py-4 px-4 sm:px-6 bg-white border-2 border-emerald-50 text-emerald-600 text-base sm:text-lg font-bold rounded-full hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm whitespace-nowrap"
            >
              Continue as Guest
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
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
          <p className="text-emerald-900 font-black tracking-tighter text-xl sm:text-2xl animate-pulse">Checking records...</p>
        </div>
      )}

      <header className="bg-white border-b px-4 sm:px-6 py-4 sm:py-5 sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-emerald-600 flex items-center gap-2 tracking-tighter">
            <i className="fa-solid fa-utensils"></i> CalorieTracker
          </h1>
          <div className="flex items-center gap-1.5">
            {isSyncing ? (
              <i className="fa-solid fa-cloud-arrow-up text-blue-400 text-xs animate-pulse"></i>
            ) : (
              <i className={`fa-solid ${user?.email === 'guest@local' ? 'fa-hard-drive text-gray-400' : 'fa-cloud-check text-emerald-400'} text-xs`}></i>
            )}
          </div>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="active:scale-90 transition-transform">
          <img src={user.picture} alt={user.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-emerald-100 shadow-sm" />
        </button>
      </header>

      <main className="flex-1 pb-40">
        <DateNavigator selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        <div className="p-4 space-y-4 sm:space-y-6">
          <NutritionSummary stats={dailyStats} goals={goals} />
          <div>
            <h2 className="text-[10px] sm:text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-2">Daily Journal</h2>
            <LogFeed entries={dailyLogs} onDelete={handleDeleteLog} onUpdate={handleUpdateLog} />
          </div>
        </div>
      </main>

      <LogComposer onLogAdded={handleAddLog} selectedDate={selectedDate} pastItems={foodHistory} />

      <SettingsDrawer 
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} 
        goals={goals} onUpdateGoals={setGoals} user={user} onLogout={handleLogout}
        fitbitCaloriesOut={fitbitCaloriesOut}
        fitbitError={fitbitError}
        onFitbitSync={handleFitbitSync}
      />
    </div>
  );
};

export default App;
