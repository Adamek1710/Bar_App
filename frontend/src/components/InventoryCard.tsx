import React from 'react';
import type { InventoryEntry } from '../api';

interface Props {
  entry: InventoryEntry;
  onUpdate: (id: number, val: number) => void;
}

export const InventoryCard: React.FC<Props> = ({ entry, onUpdate }) => {
  const isLoss = entry.difference_quantity < 0;

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-blue-500/30 transition-all shadow-lg">
      <div className="flex-1 text-center md:text-left">
        <h4 className="font-black text-white uppercase text-xl group-hover:text-blue-400 transition-colors tracking-tight">
          {entry.item_name}
        </h4>
        <div className="flex items-center justify-center md:justify-start gap-3 mt-1 text-[10px] font-bold text-slate-600 uppercase">
          <span>Skladem: <span className="text-slate-400">{entry.original_stock}</span></span>
          <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
          <span>{entry.unit_type}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6 bg-slate-950 p-4 rounded-2xl border border-slate-800 group-hover:border-slate-700 transition-all">
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 ml-1">Napočítáno</span>
          <input 
            type="number"
            inputMode="decimal"
            className="w-24 bg-transparent text-white text-3xl font-mono font-bold text-right outline-none focus:text-blue-500 transition-colors"
            value={entry.counted_quantity}
            onChange={(e) => onUpdate(entry.id, parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="border-l-2 border-slate-800 pl-6 min-w-[100px] text-right">
          <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 block">Rozdíl</span>
          <span className={`text-2xl font-black font-mono ${isLoss ? 'text-red-500' : 'text-emerald-500'}`}>
            {entry.difference_quantity > 0 ? '+' : ''}{entry.difference_quantity.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};