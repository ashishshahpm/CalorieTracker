
import React, { useState } from 'react';
import { UserGoals, User } from '../types';
import { fitbitConfig } from '../fitbitConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  goals: UserGoals;
  onUpdateGoals: (goals: UserGoals) => void;
  user: User;
  onLogout: () => void;
  fitbitCaloriesOut?: number | null;
  fitbitError?: string | null;
  onFitbitSync?: () => Promise<void>;
}

export const SettingsDrawer: React.FC<Props> = ({ 
  isOpen, onClose, goals, onUpdateGoals, user, onLogout, 
  fitbitCaloriesOut, fitbitError, onFitbitSync 
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const isConnected = !!localStorage.getItem('fitbit_access_token');

  const handleChange = (field: keyof UserGoals, value: string) => {
    onUpdateGoals({ ...goals, [field]: Number(value) || 0 });
  };

  const handleFitbitConnect = () => {
    const authUrl = new URL(fitbitConfig.authUrl);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', fitbitConfig.clientId);
    authUrl.searchParams.append('redirect_uri', fitbitConfig.redirectUri);
    authUrl.searchParams.append('scope', fitbitConfig.scope);
    window.location.href = authUrl.toString();
  };

  const handleSync = async () => {
    if (onFitbitSync) {
      setIsSyncing(true);
      await onFitbitSync();
      setIsSyncing(false);
    }
  };

  const handleUnlink = () => {
    if (confirm('Disconnect Fitbit?')) {
      localStorage.removeItem('fitbit_access_token');
      window.location.reload();
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed right-0 top-0 h-full w-4/5 max-w-[340px] bg-white z-50 shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
            <button onClick={onClose} className="p-3 text-gray-400 hover:text-gray-600 transition-colors"><i className="fa-solid fa-xmark text-2xl"></i></button>
          </div>

          <div className="space-y-10 flex-1 overflow-y-auto pr-2 hide-scrollbar">
            <div className="bg-gray-50 rounded-[32px] p-5 flex items-center gap-5 border border-gray-100">
              <img src={user.picture} alt={user.name} className="w-16 h-16 rounded-full shadow-md" />
              <div className="overflow-hidden">
                <p className="font-black text-gray-800 text-lg truncate">{user.name}</p>
                <p className="text-sm text-gray-400 truncate">{user.email}</p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-3">Integrations</h3>
              
              {!isConnected ? (
                <button 
                  onClick={handleFitbitConnect}
                  className="w-full flex items-center justify-between p-5 bg-emerald-50/50 border border-emerald-100 rounded-3xl hover:bg-emerald-50 transition-colors group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#00B0B9] rounded-xl flex items-center justify-center text-white text-sm shadow-sm">
                      <i className="fa-solid fa-person-running text-lg"></i>
                    </div>
                    <span className="text-base font-bold text-gray-700">Connect Fitbit</span>
                  </div>
                  <i className="fa-solid fa-chevron-right text-sm text-gray-300 group-hover:text-emerald-500"></i>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[32px]">
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#00B0B9] rounded-lg flex items-center justify-center text-white">
                          <i className="fa-solid fa-person-running text-sm"></i>
                        </div>
                        <span className="text-xs font-black text-[#00B0B9] uppercase tracking-wider">Connected</span>
                      </div>
                      <button onClick={handleUnlink} className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest">Unlink</button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Daily Burn</p>
                        <p className="text-2xl font-black text-gray-800">
                          {fitbitCaloriesOut !== null ? `${fitbitCaloriesOut} kcal` : '---'}
                        </p>
                      </div>
                      <button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`w-12 h-12 rounded-full bg-white shadow-md border-2 border-emerald-100 flex items-center justify-center text-[#00B0B9] active:scale-90 transition-all ${isSyncing ? 'animate-spin' : ''}`}
                      >
                        <i className="fa-solid fa-rotate text-lg"></i>
                      </button>
                    </div>
                  </div>

                  {fitbitError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                      <p className="text-xs font-bold text-red-500 flex items-center gap-2">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        {fitbitError}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-8">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-3">Daily Targets</h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                    <i className="fa-solid fa-fire text-orange-500 text-lg"></i> Calories (kcal)
                  </label>
                  <input type="number" value={goals.calories} onChange={(e) => handleChange('calories', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-xl font-bold focus:border-emerald-500 focus:outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-fish text-blue-500"></i> Protein</label>
                    <input type="number" value={goals.protein} onChange={(e) => handleChange('protein', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-lg font-bold focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-wheat-awn text-yellow-500"></i> Carbs</label>
                    <input type="number" value={goals.carbs} onChange={(e) => handleChange('carbs', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-lg font-bold focus:border-emerald-500 focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-droplet text-red-500"></i> Fat</label>
                    <input type="number" value={goals.fat} onChange={(e) => handleChange('fat', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-lg font-bold focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-seedling text-emerald-500"></i> Fiber</label>
                    <input type="number" value={goals.fiber} onChange={(e) => handleChange('fiber', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-lg font-bold focus:border-emerald-500 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <button onClick={onClose} className="w-full bg-gray-900 text-white py-5 rounded-[28px] text-lg font-black shadow-xl hover:bg-black transition-all active:scale-95 uppercase tracking-widest">Save Changes</button>
            <button onClick={onLogout} className="w-full bg-white text-red-500 py-4 rounded-[28px] text-base font-black border-2 border-red-50 shadow-sm hover:bg-red-50 transition-all active:scale-95 uppercase tracking-widest">Log Out</button>
          </div>
        </div>
      </div>
    </>
  );
};
