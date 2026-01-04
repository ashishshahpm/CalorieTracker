
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b bg-emerald-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-emerald-800">Review Items</h2>
          <button onClick={onCancel} className="text-emerald-800/50 hover:text-emerald-800">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {editedItems.length === 0 && (
            <p className="text-center text-gray-500 py-10">No items found. Try being more specific.</p>
          )}
          {editedItems.map((item) => (
            <div key={item.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative group">
              <button 
                onClick={() => removeItem(item.id)}
                className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors"
              >
                <i className="fa-solid fa-trash-can"></i>
              </button>

              <input 
                type="text" 
                value={item.name}
                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                className="font-bold text-gray-800 bg-transparent border-b border-transparent focus:border-emerald-300 focus:outline-none w-full"
              />

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-400 font-bold">Calories</label>
                  <input 
                    type="number" 
                    value={item.calories}
                    onChange={(e) => updateItem(item.id, 'calories', Number(e.target.value))}
                    className="w-full bg-white border rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-400 font-bold">Protein</label>
                  <input 
                    type="number" 
                    value={item.protein}
                    onChange={(e) => updateItem(item.id, 'protein', Number(e.target.value))}
                    className="w-full bg-white border rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-400 font-bold">Carbs</label>
                  <input 
                    type="number" 
                    value={item.carbs}
                    onChange={(e) => updateItem(item.id, 'carbs', Number(e.target.value))}
                    className="w-full bg-white border rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-400 font-bold">Fat</label>
                  <input 
                    type="number" 
                    value={item.fat}
                    onChange={(e) => updateItem(item.id, 'fat', Number(e.target.value))}
                    className="w-full bg-white border rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-400 font-bold">Fiber</label>
                  <input 
                    type="number" 
                    value={item.fiber}
                    onChange={(e) => updateItem(item.id, 'fiber', Number(e.target.value))}
                    className="w-full bg-white border rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-50 border-t flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={editedItems.length === 0}
            onClick={() => onConfirm(editedItems)}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg"
          >
            Confirm Log
          </button>
        </div>
      </div>
    </div>
  );
};
