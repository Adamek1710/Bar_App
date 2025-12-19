import React from 'react';
import type { InventoryEntry } from '../api';

interface Props {
  entry: InventoryEntry;
  onUpdate: (id: number, val: number) => void;
}

export const InventoryCard: React.FC<Props> = ({ entry, onUpdate }) => {
  const isLoss = entry.difference_quantity < 0;

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col lg:flex-row justify-between items-center gap-6 group hover:border-blue-500/30 transition-all shadow-lg">
      
      {/* Levá část: Název a info */}
      <div className="flex-1 text-center lg:text-left">
        <h4 className="font-black text-white uppercase text-xl group-hover:text-blue-400 transition-colors tracking-tight">
          {entry.item_name}
        </h4>
        <div className="flex items-center justify-center lg:justify-start gap-2 mt-1 text-[10px] font-bold text-slate-600 uppercase italic">
          <span>{entry.unit_type}</span>
          <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
          <span>ID: #{entry.item_id}</span>
        </div>
      </div>
      
      {/* Pravá část: Hodnoty a vstup */}
      <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 bg-slate-950 p-5 rounded-3xl border border-slate-800 group-hover:border-slate-700 transition-all">
        
        {/* Původní stav (Systém) */}
        <div className="flex flex-col items-center lg:items-end">
          <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">Skladem</span>
          <div className="text-3xl font-mono font-bold text-slate-400 opacity-60">
            {entry.original_stock}
          </div>
        </div>

        {/* Separátor - šipka (viditelná jen na větších displejích) */}
        <div className="hidden md:block text-slate-800 text-xl font-light">→</div>

        {/* Nový stav (Vstup) */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest mb-1">Napočítáno</span>
          <div className="relative">
            <input 
              type="number"
              inputMode="decimal"
              className="w-28 bg-slate-900 border-2 border-blue-500/20 focus:border-blue-500 rounded-xl px-2 py-1 text-white text-3xl font-mono font-bold text-center outline-none transition-all shadow-inner"
              value={entry.counted_quantity}
              onChange={(e) => onUpdate(entry.id, parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Rozdíl (Výsledek) */}
        <div className="border-l border-slate-800 pl-6 min-w-[110px] text-right">
          <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 block">Rozdíl</span>
          <div className={`text-2xl font-bold font-mono leading-none ${isLoss ? 'text-red-500' : 'text-emerald-500'}`}>
            {entry.difference_quantity > 0 ? '+' : ''}{entry.difference_quantity.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-700 font-bold uppercase mt-1">
             {entry.difference_value.toFixed(0)} Kč
          </div>
        </div>

      </div>
    </div>
  );
};