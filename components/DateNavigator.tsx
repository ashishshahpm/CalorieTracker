
import React from 'react';

interface Props {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const toLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DateNavigator: React.FC<Props> = ({ selectedDate, onDateSelect }) => {
  const dates = [];
  const now = new Date();

  for (let i = -6; i <= 0; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push(d);
  }

  return (
    <div className="bg-white border-b border-gray-50 px-4 sm:px-6 py-6 sm:py-8 overflow-x-auto hide-scrollbar sticky top-[68px] sm:top-[76px] z-10">
      <div className="flex items-center justify-between min-w-max gap-3">
        {dates.map((date) => {
          const dateStr = toLocalDateString(date);
          const isSelected = selectedDate === dateStr;
          
          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              className={`flex flex-col items-center justify-center min-w-[58px] sm:min-w-[64px] py-4 sm:py-5 px-3 rounded-[28px] transition-all duration-300 ease-out active:scale-90 ${
                isSelected 
                  ? 'bg-emerald-500 text-white shadow-[0_12px_24px_rgba(16,185,129,0.3)] scale-105' 
                  : 'bg-transparent text-gray-300 hover:text-gray-500'
              }`}
            >
              <span className={`text-[10px] sm:text-[11px] uppercase font-black tracking-[0.2em] mb-2 ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-xl sm:text-2xl font-black leading-none">
                {date.getDate()}
              </span>
            </button>
          );
        })}
        
        <div className="flex items-center pl-6 ml-2 border-l border-gray-100">
          <label className="text-gray-200 hover:text-emerald-500 cursor-pointer transition-all p-3 active:scale-90">
            <i className="fa-solid fa-calendar-day text-2xl sm:text-3xl"></i>
            <input 
              type="date" 
              className="hidden" 
              value={selectedDate}
              onChange={(e) => onDateSelect(e.target.value)}
            />
          </label>
        </div>
      </div>
    </div>
  );
};
