import React, { useState, useEffect } from 'react';
import type { InventoryEntry } from '../api';

const styles = {
  card: "bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col lg:flex-row justify-between items-center gap-6 group hover:border-blue-500/30 transition-all shadow-lg",
  
  // Left part
  infoWrapper: "flex-1 text-center lg:text-left",
  itemName: "font-black text-white uppercase text-xl group-hover:text-blue-400 transition-colors tracking-tight",
  itemMeta: "flex items-center justify-center lg:justify-start gap-2 mt-1 text-[10px] font-bold text-slate-600 uppercase italic",
  dot: "w-1 h-1 bg-slate-800 rounded-full",

  // Right part - input container
  inputGroup: "flex flex-wrap justify-center items-center gap-4 md:gap-8 bg-slate-950 p-5 rounded-3xl border border-slate-800 transition-all",
  
  // Input section
  labelBase: "text-[9px] font-black uppercase tracking-widest mb-1 block",
  
  // Inputs
  inputBase: "w-24 bg-slate-900 border-2 rounded-xl px-2 py-1 text-white text-2xl font-mono font-bold text-center outline-none transition-all",
  inputBlue: "border-blue-500/20 focus:border-blue-500",
  inputOrange: "border-orange-500/20 focus:border-orange-500",

  // diff and balance
  diffWrapper: "border-l border-slate-800 pl-6 min-w-[120px] text-right",
  diffValue: "text-2xl font-bold font-mono leading-none",
  badge: "text-[10px] font-black uppercase mt-1 px-2 py-0.5 rounded inline-block"
};

interface Props {
  entry: InventoryEntry;
  onUpdate: (id: number, qty: number | null, weight: number | null) => void;
}

export const InventoryCard: React.FC<Props> = ({ entry, onUpdate }) => {
  const isLoss = entry.difference_quantity < 0;

  const [localQty, setLocalQty] = useState<string>(entry.counted_quantity.toString());
  const [localWeight, setLocalWeight] = useState<string>(entry.counted_weight?.toString() || '');

  useEffect(() => {
    setLocalQty(entry.counted_quantity.toString());
  }, [entry.counted_quantity]);

  useEffect(() => {
    setLocalWeight(entry.counted_weight?.toString() || '');
  }, [entry.counted_weight]);

  const handleQtyChange = (val: string) => {
    setLocalQty(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onUpdate(entry.id, num, null);
    }
  };

  const handleWeightChange = (val: string) => {
    setLocalWeight(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onUpdate(entry.id, null, num);
    }
  };

  // Help function for colours
  const getDiffColor = (isLoss: boolean) => isLoss ? 'text-red-500' : 'text-emerald-500';
  const getBadgeColor = (isLoss: boolean) => isLoss ? 'bg-red-500/10 text-red-500' 
                        : 'bg-emerald-500/10 text-emerald-500';

  return (
    <div className={styles.card}>
      
      {/* Left part: Info */}
      <div className={styles.infoWrapper}>
        <h4 className={styles.itemName}>{entry.item_name}</h4>
        <div className={styles.itemMeta}>
          <span>{entry.unit_type}</span>
          <span className={styles.dot}></span>
          <span>ID: #{entry.item_id}</span>
        </div>
      </div>
      
      {/* Right part: Input */}
      <div className={styles.inputGroup}>
        
        {/* Stock */}
        <div className="flex flex-col items-center lg:items-end">
          <span className={`${styles.labelBase} text-slate-600`}>Systém</span>
          <div className="text-2xl font-mono font-bold text-slate-400 opacity-60">
            {entry.original_stock}
          </div>
        </div>

        <div className="hidden md:block text-slate-800 text-xl font-light">→</div>

        {/* INPUT: Pieces */}
        <div className="flex flex-col items-center">
          <span className={`${styles.labelBase} text-blue-500`}>
            {entry.unit_type === 'litry' ? 'Celé Lahve' : 'Počet Kusů'}
          </span>
          <input 
            type="number"
            inputMode="decimal"
            className={`${styles.inputBase} ${styles.inputBlue}`}
            value={localQty}
            onChange={(e) => handleQtyChange(e.target.value)}
            onFocus={(e) => e.target.select()} 
          />
        </div>

        {/* INPUT: Weight */}
        {entry.unit_type === 'litry' && (
          <div className="flex flex-col items-center border-l border-slate-800 pl-4">
            <span className={`${styles.labelBase} text-orange-500`}>Váha (g)</span>
            <input 
              type="number"
              inputMode="decimal"
              className={`${styles.inputBase} ${styles.inputOrange}`}
              value={localWeight}
              placeholder="0"
              onChange={(e) => handleWeightChange(e.target.value)}
              onFocus={(e) => e.target.select()}
            />
          </div>
        )}

        {/* Difference */}
        <div className={styles.diffWrapper}>
          <span className={`${styles.labelBase} text-slate-600`}>Rozdíl celkem</span>
          <div className={`${styles.diffValue} ${getDiffColor(isLoss)}`}>
            {entry.difference_quantity > 0 ? '+' : ''}{entry.difference_quantity.toFixed(2)}
          </div>
          <div className={`${styles.badge} ${getBadgeColor(isLoss)}`}>
             {entry.difference_value.toFixed(0)} Kč
          </div>
        </div>

      </div>
    </div>
  );
};