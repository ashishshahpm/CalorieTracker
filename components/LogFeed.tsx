
import React, { useState } from 'react';
import { LogEntry } from '../types';
import { ResultReview } from './ResultReview';

interface Props {
  entries: LogEntry[];
  onDelete: (id: string) => void;
  onUpdate: (entry: LogEntry) => void;
}

export const LogFeed: React.FC<Props> = ({ entries, onDelete, onUpdate }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [viewingTranscript, setViewingTranscript] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);

  const toggleMenu = (id: string) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

  return (
    <div className="space-y-5 sm:space-y-6 min-h-[100px] relative pb-10">
      {entries.length === 0 && (
        <div className="text-center py-20 sm:py-24 bg-white rounded-[32px] sm:rounded-[40px] border-2 border-dashed border-gray-100 transition-opacity duration-300">
          <div className="text-gray-200 mb-5">
            <i className="fa-solid fa-utensils text-5xl sm:text-6xl"></i>
          </div>
          <p className="text-gray-400 font-bold uppercase text-xs sm:text-sm tracking-widest">No entries yet</p>
        </div>
      )}

      {entries.map((entry) => {
        const totalCals = entry.items.reduce((sum, i) => sum + i.calories, 0);
        const totalProtein = entry.items.reduce((sum, i) => sum + i.protein, 0);
        const totalCarbs = entry.items.reduce((sum, i) => sum + i.carbs, 0);
        const totalFat = entry.items.reduce((sum, i) => sum + i.fat, 0);
        const totalFiber = entry.items.reduce((sum, i) => sum + i.fiber, 0);

        return (
          <div 
            key={entry.id} 
            className="bg-white rounded-[28px] sm:rounded-[32px] shadow-sm border border-gray-100 overflow-visible group relative transition-all active:scale-[0.98] animate-in slide-in-from-bottom-4 fade-in duration-200"
          >
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                <div className="flex items-center gap-3 sm:gap-4 relative">
                  <span className="text-sm sm:text-base font-black text-gray-600 tracking-tight">
                    {Math.round(totalCals)} kcal
                  </span>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(entry.id);
                    }}
                    className="text-gray-300 hover:text-gray-600 transition-colors p-2"
                  >
                    <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
                  </button>

                  {activeMenu === entry.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
                      <div className="absolute right-0 top-full mt-2 w-44 sm:w-48 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <button 
                          onClick={() => {
                            setViewingTranscript(entry.transcript || "No transcript available.");
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-5 py-4 text-xs sm:text-sm font-black uppercase text-gray-500 hover:bg-gray-50 flex items-center gap-4 transition-colors"
                        >
                          <i className="fa-solid fa-eye w-5 text-base"></i> View
                        </button>
                        <button 
                          onClick={() => {
                            setEditingEntry(entry);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-5 py-4 text-xs sm:text-sm font-black uppercase text-gray-500 hover:bg-gray-50 flex items-center gap-4 transition-colors"
                        >
                          <i className="fa-solid fa-pen w-5 text-base"></i> Edit
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Remove this entry?')) onDelete(entry.id);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-5 py-4 text-xs sm:text-sm font-black uppercase text-red-500 hover:bg-red-50 flex items-center gap-4 transition-colors"
                        >
                          <i className="fa-solid fa-trash-can w-5 text-base"></i> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="mb-5 sm:mb-6 overflow-hidden">
                <h3 className="text-xl sm:text-2xl font-black text-gray-800 leading-tight">
                  {entry.items.length > 0 ? entry.items.map(i => i.name).join(', ') : 'Unknown Entry'}
                </h3>
              </div>

              {entry.image && (
                <div className="mb-5 sm:mb-6 rounded-[24px] sm:rounded-[32px] overflow-hidden border border-gray-50 aspect-video bg-gray-50 shadow-inner">
                  <img src={entry.image} className="w-full h-full object-cover" alt="Meal" loading="lazy" />
                </div>
              )}

              <div className="pt-5 sm:pt-6 border-t border-gray-50 flex flex-wrap gap-x-4 sm:gap-x-7 gap-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black text-blue-400 uppercase tracking-widest">Prot</span>
                  <span className="text-sm sm:text-base font-black text-gray-700 tabular-nums">{totalProtein.toFixed(0)}g</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black text-yellow-500 uppercase tracking-widest">Carbs</span>
                  <span className="text-sm sm:text-base font-black text-gray-700 tabular-nums">{totalCarbs.toFixed(0)}g</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black text-red-400 uppercase tracking-widest">Fat</span>
                  <span className="text-sm sm:text-base font-black text-gray-700 tabular-nums">{totalFat.toFixed(0)}g</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black text-emerald-500 uppercase tracking-widest">Fiber</span>
                  <span className="text-sm sm:text-base font-black text-gray-700 tabular-nums">{totalFiber.toFixed(0)}g</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {editingEntry && (
        <ResultReview 
          items={editingEntry.items} 
          onCancel={() => setEditingEntry(null)} 
          onConfirm={(items) => {
            onUpdate({ ...editingEntry, items });
            setEditingEntry(null);
          }} 
        />
      )}

      {viewingTranscript && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-8 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 sm:p-10 shadow-2xl relative">
            <h4 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-5 sm:mb-6 text-center">Transcription</h4>
            <div className="text-gray-800 text-lg sm:text-xl font-medium leading-relaxed italic border-l-4 border-emerald-500 pl-5 sm:pl-6 py-3 sm:py-4 bg-emerald-50/50 rounded-r-3xl">
              "{viewingTranscript}"
            </div>
            <button 
              onClick={() => setViewingTranscript(null)}
              className="mt-8 sm:mt-10 w-full py-4 sm:py-5 bg-gray-900 text-white rounded-[28px] font-black uppercase text-xs sm:text-sm tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
