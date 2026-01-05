
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
    <div className="space-y-4 min-h-[100px] relative">
      {/* Empty State */}
      {entries.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 transition-opacity duration-300">
          <div className="text-gray-200 mb-2">
            <i className="fa-solid fa-utensils text-5xl"></i>
          </div>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No entries yet</p>
        </div>
      )}

      {/* Entries List */}
      {entries.map((entry) => {
        const totalCals = entry.items.reduce((sum, i) => sum + i.calories, 0);
        const totalProtein = entry.items.reduce((sum, i) => sum + i.protein, 0);
        const totalCarbs = entry.items.reduce((sum, i) => sum + i.carbs, 0);
        const totalFat = entry.items.reduce((sum, i) => sum + i.fat, 0);
        const totalFiber = entry.items.reduce((sum, i) => sum + i.fiber, 0);

        return (
          <div 
            key={entry.id} 
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-visible group relative transition-all active:scale-[0.99] animate-in slide-in-from-bottom-2 fade-in duration-200"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                <div className="flex items-center gap-3 relative">
                  <span className="text-xs font-black text-gray-500 tracking-tight">
                    {Math.round(totalCals)} kcal
                  </span>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(entry.id);
                    }}
                    className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                  >
                    <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
                  </button>

                  {/* Context Menu Dropdown */}
                  {activeMenu === entry.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
                      <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <button 
                          onClick={() => {
                            setViewingTranscript(entry.transcript || "No transcript available for this entry.");
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-3 text-[11px] font-black uppercase text-gray-500 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <i className="fa-solid fa-eye w-4"></i> View
                        </button>
                        <button 
                          onClick={() => {
                            setEditingEntry(entry);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-3 text-[11px] font-black uppercase text-gray-500 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <i className="fa-solid fa-pen w-4"></i> Edit
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Remove this entry?')) onDelete(entry.id);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-3 text-[11px] font-black uppercase text-red-500 hover:bg-red-50 flex items-center gap-2"
                        >
                          <i className="fa-solid fa-trash-can w-4"></i> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="mb-4 overflow-hidden">
                <h3 className="text-lg font-black text-gray-800 leading-tight truncate">
                  {entry.items.length > 0 ? entry.items.map(i => i.name).join(', ') : 'Unknown Entry'}
                </h3>
              </div>

              {entry.image && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-gray-50 aspect-video bg-gray-50">
                  <img src={entry.image} className="w-full h-full object-cover" alt="Meal" loading="lazy" />
                </div>
              )}

              <div className="pt-4 border-t border-gray-50 flex flex-wrap gap-x-5 gap-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Protein:</span>
                  <span className="text-[10px] font-black text-gray-700">{totalProtein.toFixed(1)}G</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">Carbs:</span>
                  <span className="text-[10px] font-black text-gray-700">{totalCarbs.toFixed(1)}G</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Fat:</span>
                  <span className="text-[10px] font-black text-gray-700">{totalFat.toFixed(1)}G</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Fiber:</span>
                  <span className="text-[10px] font-black text-gray-700">{totalFiber.toFixed(1)}G</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Editing Modal */}
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

      {/* Transcript Viewer Modal */}
      {viewingTranscript && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">What you said</h4>
            <div className="text-gray-800 font-medium leading-relaxed italic border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-50/50 rounded-r-xl">
              "{viewingTranscript}"
            </div>
            <button 
              onClick={() => setViewingTranscript(null)}
              className="mt-8 w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
