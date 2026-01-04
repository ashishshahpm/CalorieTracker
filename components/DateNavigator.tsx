
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

  // Create a 7-day window ending today (Local Time)
  for (let i = -6; i <= 0; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push(d);
  }

  return (
    <div className="bg-white border-b border-gray-50 px-4 py-6 overflow-x-auto hide-scrollbar sticky top-[53px] z-10">
      <div className="flex items-center justify-between min-w-max gap-1">
        {dates.map((date) => {
          const dateStr = toLocalDateString(date);
          const isSelected = selectedDate === dateStr;
          
          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              className={`flex flex-col items-center justify-center min-w-[50px] py-3 px-2 rounded-[20px] transition-all duration-300 ease-out ${
                isSelected 
                  ? 'bg-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] scale-110' 
                  : 'bg-transparent text-gray-300 hover:text-gray-500'
              }`}
            >
              <span className={`text-[9px] uppercase font-black tracking-[0.15em] mb-1 ${isSelected ? 'opacity-80' : 'opacity-60'}`}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-base font-black leading-none">
                {date.getDate()}
              </span>
            </button>
          );
        })}
        
        <div className="flex items-center pl-4 ml-2 border-l border-gray-100">
          <label className="text-gray-200 hover:text-emerald-500 cursor-pointer transition-colors p-2">
            <i className="fa-solid fa-calendar-day text-lg"></i>
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
