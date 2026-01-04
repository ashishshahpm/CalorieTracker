
import React from 'react';
import { LogEntry } from '../types';

interface Props {
  entries: LogEntry[];
  onDelete: (id: string) => void;
  onUpdate: (entry: LogEntry) => void;
}

export const LogFeed: React.FC<Props> = ({ entries, onDelete, onUpdate }) => {
  return (
    <div className="space-y-4 min-h-[100px] relative">
      {/* Empty State - Rendered conditionally but without a full component swap to prevent flicker */}
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
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group relative transition-all active:scale-[0.98] animate-in slide-in-from-bottom-2 fade-in duration-200"
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Remove this entry?')) onDelete(entry.id);
              }}
              className="absolute top-4 right-4 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2 z-10"
            >
              <i className="fa-solid fa-trash-can text-sm"></i>
            </button>

            <div className="p-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-xs font-black text-gray-500 tracking-tight">
                  {Math.round(totalCals)} kcal
                </span>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-black text-gray-800 leading-tight">
                  {entry.items.length > 0 ? entry.items.map(i => i.name).join(', ') : 'Unknown Entry'}
                </h3>
                {entry.transcript && (
                  <p className="text-sm text-gray-500/60 italic mt-1 font-medium">
                    "{entry.transcript.toLowerCase()}"
                  </p>
                )}
              </div>

              {entry.image && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-gray-50 aspect-video bg-gray-50">
                  <img src={entry.image} className="w-full h-full object-cover" alt="Meal" loading="lazy" />
                </div>
              )}

              <div className="pt-4 border-t border-gray-50 flex flex-wrap gap-x-5 gap-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Protein:</span>
                  <span className="text-[10px] font-black text-gray-700">{totalProtein.toFixed(1)}G</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Carbs:</span>
                  <span className="text-[10px] font-black text-gray-700">{totalCarbs.toFixed(1)}G</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fat:</span>
                  <span className="text-[10px] font-black text-gray-700">{totalFat.toFixed(1)}G</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fiber:</span>
                  <span className="text-[10px] font-black text-gray-700">{totalFiber.toFixed(1)}G</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
