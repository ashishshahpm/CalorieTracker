
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
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 space-y-6 min-h-[280px]">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Daily Calories</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-4xl font-black text-gray-800 leading-none min-w-[60px]">
              {Math.round(stats.calories)}
            </h3>
            <span className="text-lg font-bold text-gray-300">/ {goals.calories} kcal</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full transition-colors">
            {calsLeft} kcal left
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-50 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-emerald-400 h-2 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(52,211,153,0.4)]" 
          style={{ width: `${calPercentage}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-12 gap-y-6 pt-2">
        {nutrients.map((n) => (
          <div key={n.label} className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-gray-400">{n.label}</span>
              <span className="text-gray-700 tabular-nums">{Math.round(n.value)}G / {n.goal}G</span>
            </div>
            <div className="w-full bg-gray-50 rounded-full h-1 overflow-hidden">
              <div 
                className={`${n.color} h-1 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${Math.min((n.value / n.goal) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
