import React from 'react';
import type { InventoryEntry } from '../api';
import { InventoryCard } from './InventoryCard'; 

interface Props {
  entries: InventoryEntry[];
  totalDiff: number;
  onUpdate: (id: number, qty: number | null, weight: number | null) => void;
  onFinish: () => void;
}

export const InventoryMode: React.FC<Props> = ({ entries, totalDiff, onUpdate, onFinish }) => (
  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
    {/* Sticky Header s celkovým mankem */}
    <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl py-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="text-center md:text-left">
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Aktuální bilance (manko/přebytek)</p>
        <h2 className={`text-5xl font-black tracking-tighter ${totalDiff < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
          {totalDiff.toFixed(2)} <span className="text-xl opacity-50 font-light italic">Kč</span>
        </h2>
      </div>
      <button 
        onClick={onFinish} 
        className="w-full md:w-auto bg-red-600 hover:bg-red-500 px-12 py-5 rounded-2xl font-black shadow-2xl shadow-red-900/40 transition-all active:scale-95 text-white"
      >
        UKONČIT INVENTURU
      </button>
    </div>

    {/* Seznam karet */}
    <div className="grid gap-4">
      {entries.map((entry) => (
        <InventoryCard 
          key={entry.id} 
          entry={entry} 
          onUpdate={onUpdate} 
        />
      ))}
    </div>
  </div>
);