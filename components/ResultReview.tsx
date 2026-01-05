
import React, { useState } from 'react';
import { FoodItem } from '../types';

interface Props {
  items: FoodItem[];
  onConfirm: (items: FoodItem[]) => void;
  onCancel: () => void;
}

export const ResultReview: React.FC<Props> = ({ items, onConfirm, onCancel }) => {
  const [editedItems, setEditedItems] = useState<FoodItem[]>(items);

  const updateItem = (id: string, field: keyof FoodItem, value: any) => {
    setEditedItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    setEditedItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b bg-emerald-50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-emerald-800">Review Items</h2>
          <button onClick={onCancel} className="text-emerald-800/50 hover:text-emerald-800 p-2">
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {editedItems.length === 0 && (
            <p className="text-center text-gray-500 py-16 text-lg">No items found. Try being more specific.</p>
          )}
          {editedItems.map((item) => (
            <div key={item.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-5 relative group">
              <button 
                onClick={() => removeItem(item.id)}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-1"
              >
                <i className="fa-solid fa-trash-can text-lg"></i>
              </button>

              <input 
                type="text" 
                value={item.name}
                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                className="text-xl font-bold text-gray-800 bg-transparent border-b-2 border-transparent focus:border-emerald-300 focus:outline-none w-full pb-1"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase text-gray-400 font-black tracking-widest">Calories</label>
                  <input 
                    type="number" 
                    value={item.calories}
                    onChange={(e) => updateItem(item.id, 'calories', Number(e.target.value))}
                    className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-2.5 text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase text-gray-400 font-black tracking-widest">Protein (g)</label>
                  <input 
                    type="number" 
                    value={item.protein}
                    onChange={(e) => updateItem(item.id, 'protein', Number(e.target.value))}
                    className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-2.5 text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase text-gray-400 font-black tracking-widest">Carbs (g)</label>
                  <input 
                    type="number" 
                    value={item.carbs}
                    onChange={(e) => updateItem(item.id, 'carbs', Number(e.target.value))}
                    className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-2.5 text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase text-gray-400 font-black tracking-widest">Fat (g)</label>
                  <input 
                    type="number" 
                    value={item.fat}
                    onChange={(e) => updateItem(item.id, 'fat', Number(e.target.value))}
                    className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-2.5 text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 border-t flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 px-4 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 text-base hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={editedItems.length === 0}
            onClick={() => onConfirm(editedItems)}
            className="flex-1 py-4 px-4 rounded-2xl bg-emerald-500 text-white font-black text-base hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-xl"
          >
            Confirm Log
          </button>
        </div>
      </div>
    </div>
  );
};
