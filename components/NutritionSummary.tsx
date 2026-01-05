
import React from 'react';
import { DailyStats, UserGoals } from '../types';

interface Props {
  stats: DailyStats;
  goals: UserGoals;
}

export const NutritionSummary: React.FC<Props> = ({ stats, goals }) => {
  const nutrients = [
    { label: 'Protein', value: stats.protein, goal: goals.protein, color: 'bg-blue-400', unit: 'g' },
    { label: 'Carbs', value: stats.carbs, goal: goals.carbs, color: 'bg-yellow-400', unit: 'g' },
    { label: 'Fat', value: stats.fat, goal: goals.fat, color: 'bg-red-400', unit: 'g' },
    { label: 'Fiber', value: stats.fiber, goal: goals.fiber, color: 'bg-emerald-400', unit: 'g' },
  ];

  const calPercentage = Math.min((stats.calories / goals.calories) * 100, 100);
  const calsLeft = Math.max(0, goals.calories - Math.round(stats.calories));

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-5 sm:p-8 space-y-6 sm:space-y-8 min-h-[280px] sm:min-h-[320px]">
      <div className="flex justify-between items-start gap-2">
        <div className="space-y-1 sm:space-y-2">
          <p className="text-gray-400 text-[9px] sm:text-xs font-black uppercase tracking-widest">Daily Calories</p>
          <div className="flex items-baseline gap-1 sm:gap-2">
            <h3 className="text-3xl sm:text-5xl font-black text-gray-800 leading-none min-w-[45px] sm:min-w-[75px]">
              {Math.round(stats.calories)}
            </h3>
            <span className="text-xs sm:text-xl font-bold text-gray-300">/ {goals.calories}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] sm:text-sm font-black text-emerald-500 bg-emerald-50 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors whitespace-nowrap">
            {calsLeft} left
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-50 rounded-full h-2.5 sm:h-3 overflow-hidden">
        <div 
          className="bg-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(52,211,153,0.4)]" 
          style={{ width: `${calPercentage}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-2 sm:gap-x-6 gap-y-5 sm:gap-y-8 pt-2">
        {nutrients.map((n) => (
          <div key={n.label} className="space-y-2 sm:space-y-2.5">
            <div className="flex justify-between text-[8px] sm:text-[10px] font-bold uppercase tracking-widest gap-1">
              <span className="text-gray-400 truncate max-w-[40px] sm:max-w-none">{n.label}</span>
              <span className="text-gray-700 tabular-nums whitespace-nowrap">{Math.round(n.value)}{n.unit}</span>
            </div>
            <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`${n.color} h-1.5 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${Math.min((n.value / n.goal) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
