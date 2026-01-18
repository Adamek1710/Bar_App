import React, { useState, useEffect } from 'react';
import type { InventoryEntry } from '../api';

interface Props {
  entry: InventoryEntry;
  onUpdate: (id: number, qty: number | null, weight: number | null) => void;
}

export const InventoryCard: React.FC<Props> = ({ entry, onUpdate }) => {
  const isLoss = entry.difference_quantity < 0;

  // LOKÁLNÍ STAVY PRO INPUTY (aby šlo mazat a psát bez skákání kurzoru)
  const [localQty, setLocalQty] = useState<string>(entry.counted_quantity.toString());
  const [localWeight, setLocalWeight] = useState<string>(entry.counted_weight?.toString() || '');

  // Synchronizace, pokud data změní někdo jiný přes socket
  useEffect(() => {
    setLocalQty(entry.counted_quantity.toString());
  }, [entry.counted_quantity]);

  useEffect(() => {
    setLocalWeight(entry.counted_weight?.toString() || '');
  }, [entry.counted_weight]);

  const handleQtyChange = (val: string) => {
    setLocalQty(val);
    const num = parseFloat(val);
    // Posíláme update jen pokud je to validní číslo (včetně nuly)
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

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col lg:flex-row justify-between items-center gap-6 group hover:border-blue-500/30 transition-all shadow-lg">
      
      {/* Levá část: Název */}
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
      
      {/* Pravá část: Vstupy */}
      <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 bg-slate-950 p-5 rounded-3xl border border-slate-800 transition-all">
        
        {/* Skladem */}
        <div className="flex flex-col items-center lg:items-end">
          <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">Systém</span>
          <div className="text-2xl font-mono font-bold text-slate-400 opacity-60">
            {entry.original_stock}
          </div>
        </div>

        <div className="hidden md:block text-slate-800 text-xl font-light">→</div>

        {/* INPUT: CELÉ KUSY */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest mb-1">
            {entry.unit_type === 'litry' ? 'Celé Lahve' : 'Počet Kusů'}
          </span>
          <input 
            type="number"
            inputMode="decimal"
            className="w-24 bg-slate-900 border-2 border-blue-500/20 focus:border-blue-500 rounded-xl px-2 py-1 text-white text-2xl font-mono font-bold text-center outline-none transition-all"
            value={localQty}
            onChange={(e) => handleQtyChange(e.target.value)}
            onFocus={(e) => e.target.select()} // Bonus: při kliknutí vybere vše pro rychlé přepsání
          />
        </div>

        {/* INPUT: VÁHA OTEVŘENÉ LAHVE */}
        {entry.unit_type === 'litry' && (
          <div className="flex flex-col items-center border-l border-slate-800 pl-4">
            <span className="text-[9px] text-orange-500 font-black uppercase tracking-widest mb-1">Váha (g)</span>
            <input 
              type="number"
              inputMode="decimal"
              className="w-24 bg-slate-900 border-2 border-orange-500/20 focus:border-orange-500 rounded-xl px-2 py-1 text-white text-2xl font-mono font-bold text-center outline-none transition-all"
              value={localWeight}
              placeholder="0"
              onChange={(e) => handleWeightChange(e.target.value)}
              onFocus={(e) => e.target.select()}
            />
          </div>
        )}

        {/* Rozdíl */}
        <div className="border-l border-slate-800 pl-6 min-w-[120px] text-right">
          <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 block">Rozdíl celkem</span>
          <div className={`text-2xl font-bold font-mono leading-none ${isLoss ? 'text-red-500' : 'text-emerald-500'}`}>
            {entry.difference_quantity > 0 ? '+' : ''}{entry.difference_quantity.toFixed(2)}
          </div>
          <div className={`text-[10px] font-black uppercase mt-1 px-2 py-0.5 rounded inline-block ${isLoss ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
             {entry.difference_value.toFixed(0)} Kč
          </div>
        </div>

      </div>
    </div>
  );
};