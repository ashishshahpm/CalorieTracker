
import React from 'react';
import { UserGoals, User } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  goals: UserGoals;
  onUpdateGoals: (goals: UserGoals) => void;
  user: User;
  onLogout: () => void;
}

export const SettingsDrawer: React.FC<Props> = ({ isOpen, onClose, goals, onUpdateGoals, user, onLogout }) => {
  const handleChange = (field: keyof UserGoals, value: string) => {
    onUpdateGoals({ ...goals, [field]: Number(value) || 0 });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-4/5 max-w-[320px] bg-white z-50 shadow-2xl transition-transform duration-300 transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-gray-800">Settings</h2>
            <button onClick={onClose} className="p-2 text-gray-400">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <div className="space-y-8 flex-1 overflow-y-auto pr-2">
            {/* User Profile */}
            <div className="bg-gray-50 rounded-3xl p-4 flex items-center gap-4 border border-gray-100">
              <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full shadow-sm" />
              <div className="overflow-hidden">
                <p className="font-bold text-gray-800 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Daily Targets</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <i className="fa-solid fa-fire text-orange-500"></i>
                    Calories (kcal)
                  </label>
                  <input 
                    type="number" 
                    value={goals.calories}
                    onChange={(e) => handleChange('calories', e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-lg font-bold focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-fish text-blue-500"></i>
                      Protein (g)
                    </label>
                    <input 
                      type="number" 
                      value={goals.protein}
                      onChange={(e) => handleChange('protein', e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-wheat-awn text-yellow-500"></i>
                      Carbs (g)
                    </label>
                    <input 
                      type="number" 
                      value={goals.carbs}
                      onChange={(e) => handleChange('carbs', e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-droplet text-red-500"></i>
                      Fat (g)
                    </label>
                    <input 
                      type="number" 
                      value={goals.fat}
                      onChange={(e) => handleChange('fat', e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-seedling text-emerald-500"></i>
                      Fiber (g)
                    </label>
                    <input 
                      type="number" 
                      value={goals.fiber}
                      onChange={(e) => handleChange('fiber', e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button 
              onClick={onClose}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-black transition-all active:scale-95"
            >
              Save & Close
            </button>
            <button 
              onClick={onLogout}
              className="w-full bg-white text-red-500 py-3 rounded-2xl font-bold border-2 border-red-50 shadow-sm hover:bg-red-50 transition-all active:scale-95"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
