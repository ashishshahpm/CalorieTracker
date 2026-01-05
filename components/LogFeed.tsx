
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
    <div className="space-y-4 sm:space-y-6 min-h-[100px] relative">
      {entries.length === 0 && (
        <div className="text-center py-16 sm:py-24 bg-white rounded-[32px] sm:rounded-[40px] border-2 border-dashed border-gray-100 transition-opacity duration-300">
          <div className="text-gray-200 mb-4">
            <i className="fa-solid fa-utensils text-4xl sm:text-6xl"></i>
          </div>
          <p className="text-gray-400 font-bold uppercase text-[10px] sm:text-xs tracking-widest">No entries yet</p>
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
            className="bg-white rounded-[24px] sm:rounded-[32px] shadow-sm border border-gray-100 overflow-visible group relative transition-all active:scale-[0.99] animate-in slide-in-from-bottom-3 fade-in duration-200"
          >
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                <div className="flex items-center gap-2 sm:gap-4 relative">
                  <span className="text-xs sm:text-sm font-black text-gray-500 tracking-tight">
                    {Math.round(totalCals)} kcal
                  </span>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(entry.id);
                    }}
                    className="text-gray-300 hover:text-gray-500 transition-colors p-2"
                  >
                    <i className="fa-solid fa-ellipsis-vertical text-base"></i>
                  </button>

                  {activeMenu === entry.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
                      <div className="absolute right-0 top-full mt-2 w-40 sm:w-44 bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <button 
                          onClick={() => {
                            setViewingTranscript(entry.transcript || "No transcript available.");
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 sm:px-5 py-3 sm:py-4 text-[10px] sm:text-xs font-black uppercase text-gray-500 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <i className="fa-solid fa-eye w-5 text-sm"></i> View
                        </button>
                        <button 
                          onClick={() => {
                            setEditingEntry(entry);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 sm:px-5 py-3 sm:py-4 text-[10px] sm:text-xs font-black uppercase text-gray-500 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <i className="fa-solid fa-pen w-5 text-sm"></i> Edit
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Remove this entry?')) onDelete(entry.id);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 sm:px-5 py-3 sm:py-4 text-[10px] sm:text-xs font-black uppercase text-red-500 hover:bg-red-50 flex items-center gap-3"
                        >
                          <i className="fa-solid fa-trash-can w-5 text-sm"></i> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="mb-4 sm:mb-6 overflow-hidden">
                <h3 className="text-lg sm:text-xl font-black text-gray-800 leading-tight">
                  {entry.items.length > 0 ? entry.items.map(i => i.name).join(', ') : 'Unknown Entry'}
                </h3>
              </div>

              {entry.image && (
                <div className="mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-50 aspect-video bg-gray-50 shadow-sm">
                  <img src={entry.image} className="w-full h-full object-cover" alt="Meal" loading="lazy" />
                </div>
              )}

              <div className="pt-4 sm:pt-6 border-t border-gray-50 flex flex-wrap gap-x-2.5 sm:gap-x-6 gap-y-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest">P</span>
                  <span className="text-[10px] sm:text-xs font-black text-gray-700">{totalProtein.toFixed(0)}g</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-[8px] sm:text-[10px] font-black text-yellow-400 uppercase tracking-widest">C</span>
                  <span className="text-[10px] sm:text-xs font-black text-gray-700">{totalCarbs.toFixed(0)}g</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-[8px] sm:text-[10px] font-black text-red-400 uppercase tracking-widest">F</span>
                  <span className="text-[10px] sm:text-xs font-black text-gray-700">{totalFat.toFixed(0)}g</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-[8px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-widest">Fi</span>
                  <span className="text-[10px] sm:text-xs font-black text-gray-700">{totalFiber.toFixed(0)}g</span>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-8 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] sm:rounded-[40px] p-8 sm:p-10 shadow-2xl relative">
            <h4 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 sm:mb-6">What you said</h4>
            <div className="text-gray-800 text-base sm:text-lg font-medium leading-relaxed italic border-l-4 border-emerald-500 pl-4 sm:pl-6 py-2 sm:py-3 bg-emerald-50/50 rounded-r-xl sm:rounded-r-2xl">
              "{viewingTranscript}"
            </div>
            <button 
              onClick={() => setViewingTranscript(null)}
              className="mt-8 sm:mt-10 w-full py-4 sm:py-5 bg-gray-900 text-white rounded-2xl sm:rounded-3xl font-black uppercase text-[10px] sm:text-xs tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
