import React from 'react';
import type { Item } from '../api';

interface StockCardProps {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}

export const StockCard: React.FC<StockCardProps> = ({ item, onEdit, onDelete }) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-blue-500/30 transition-all shadow-lg">
    <div className="flex-1 text-center md:text-left">
      <div className="font-black text-white uppercase text-xl group-hover:text-blue-400 transition-colors tracking-tight">
        {item.name}
      </div>
      <div className="flex items-center justify-center md:justify-start gap-3 mt-1">
        <div className="text-[10px] text-slate-600 font-bold uppercase italic tracking-wider opacity-60">
          ID: #{item.id}
        </div>
        {item.unit_type === 'litry' && (
          <div className="flex flex-wrap gap-2">
             {/* TADY JE TA ZMĚNA: Aktuální váha načaté lahve */}
             <span className="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black uppercase border border-blue-400/30 shadow-sm shadow-blue-900/40">
               ⚖️ Aktuálně: {item.current_weight || 0}g
             </span>
             
             <span className="text-[8px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-black uppercase border border-slate-700">
               Plná: {item.full_bottle_weight}g
             </span>
             <span className="text-[8px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-black uppercase border border-slate-700">
               Dávka: {item.shot_volume}L
             </span>
          </div>
        )}
      </div>
    </div>
    
    {/* Zbytek komponenty zůstává stejný... */}
    <div className="flex items-center gap-8">
      <div className="text-center md:text-right">
        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 block">Skladem</span>
        <div className="text-3xl font-black text-blue-500 font-mono tracking-tighter leading-none">
          {item.unit_type === 'kusy' ? Math.floor(item.current_stock) : item.current_stock.toFixed(2)}
          <span className="text-[10px] ml-1 text-slate-600 uppercase">{item.unit_type === 'litry' ? 'l' : 'ks'}</span>
        </div>
      </div>

      <div className="text-center md:text-right border-l border-slate-800 pl-8">
        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 block">Cena</span>
        <div className="text-2xl font-black text-emerald-500 tracking-tighter leading-none">
          {item.selling_price.toFixed(0)}<span className="text-xs ml-0.5 opacity-50">Kč</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 ml-4">
        <button 
          onClick={() => onEdit(item)}
          className="text-blue-500 hover:text-white hover:bg-blue-500 px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest border border-blue-500/20"
        >
          Upravit
        </button>
        <button 
          onClick={() => onDelete(item)}
          className="text-slate-700 hover:text-red-500 px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest"
        >
          Smazat
        </button>
      </div>
    </div>
  </div>
);