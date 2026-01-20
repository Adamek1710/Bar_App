import React from 'react';
import type { InventoryEntry } from '../api';
import { InventoryCard } from './InventoryCard'; 

const styles = {
  wrapper: "space-y-6 animate-in slide-in-from-bottom-4 duration-500",
  
  // Sticky bar and balance
  stickyHeader: "sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl py-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6",
  balanceLabel: "text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1",
  balanceValue: "text-5xl font-black tracking-tighter",
  currency: "text-xl opacity-50 font-light italic",
  
  // Main button
  finishBtn: "w-full md:w-auto bg-red-600 hover:bg-red-500 px-12 py-5 rounded-2xl font-black shadow-2xl shadow-red-900/40 transition-all active:scale-95 text-white",
  
  // Card Grid
  grid: "grid gap-4"
};

interface Props {
  entries: InventoryEntry[];
  totalDiff: number;
  onUpdate: (id: number, qty: number | null, weight: number | null) => void;
  onFinish: () => void;
}

export const InventoryMode: React.FC<Props> = ({ entries, totalDiff, onUpdate, onFinish }) => {
  const balanceColor = totalDiff < 0 ? 'text-red-500' : 'text-emerald-500';
  
  return (
    <div className={styles.wrapper}>
      <div className={styles.stickyHeader}>
        <div className="text-center md:text-left">
          <p className={styles.balanceLabel}>Aktuální bilance (manko/přebytek)</p>
          <h2 className={`${styles.balanceValue} ${balanceColor}`}>
            {totalDiff.toFixed(2)} <span className={styles.currency}>Kč</span>
          </h2>
        </div>

        <button onClick={onFinish} className={styles.finishBtn}>
          UKONČIT INVENTURU
        </button>
      </div>

      {/* Seznam karet */}
      <div className={styles.grid}>
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
};