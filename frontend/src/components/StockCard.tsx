import React from 'react';
import type { Item } from '../api';

const styles = {
  card: "bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-blue-500/30 transition-all shadow-lg",
  
  // Info section
  infoWrapper: "flex-1 text-center md:text-left",
  itemName: "font-black text-white uppercase text-xl group-hover:text-blue-400 transition-colors tracking-tight",
  itemId: "text-[10px] text-slate-600 font-bold uppercase italic tracking-wider opacity-60",
  
  // Badges weight and bottle info
  badgeWrapper: "flex flex-wrap justify-center md:justify-start gap-2 mt-2",
  badgeBase: "text-[8px] px-2 py-0.5 rounded-full font-black uppercase border shadow-sm",
  badgeCurrent: "bg-blue-600 text-white border-blue-400/30 shadow-blue-900/40",
  badgeGhost: "bg-slate-800 text-slate-400 border-slate-700",

  // Values section
  actionsWrapper: "flex items-center gap-8",
  statBox: "text-center md:text-right",
  statLabel: "text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 block",
  
  // Big numbers
  stockValue: "text-3xl font-black text-blue-500 font-mono tracking-tighter leading-none",
  priceValue: "text-2xl font-black text-emerald-500 tracking-tighter leading-none",
  unit: "text-[10px] ml-1 text-slate-600 uppercase",
  
  // Buttons
  btnWrapper: "flex flex-col gap-2 ml-4",
  btnEdit: "text-blue-500 hover:text-white hover:bg-blue-500 px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest border border-blue-500/20",
  btnDelete: "text-slate-700 hover:text-red-500 px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest"
};

interface StockCardProps {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}

export const StockCard: React.FC<StockCardProps> = ({ item, onEdit, onDelete }) => (
  <div className={styles.card}>

    {/* Info section */}
    <div className={styles.infoWrapper}>
      <div className={styles.itemName}>{item.name}</div>
      <div className="flex items-center justify-center md:justify-start gap-3 mt-1">
        <div className={styles.itemId}>ID: #{item.id}</div>
        {item.unit_type === 'litry' && (
          <div className={styles.badgeWrapper}>
             <span className={`${styles.badgeBase} ${styles.badgeCurrent}`}>
               ⚖️ Aktuálně: {item.current_weight || 0}g
             </span>
             
             <span className={`${styles.badgeBase} ${styles.badgeGhost}`}>
               Plná: {item.full_bottle_weight}g
             </span>
             <span className={`${styles.badgeBase} ${styles.badgeGhost}`}>
               Dávka: {item.shot_volume}L
             </span>
          </div>
        )}
      </div>
    </div>
    
    {/* Values and actions */}
    <div className={styles.actionsWrapper}>
      <div className={styles.statBox}>
        <span className={styles.statLabel}>Skladem</span>
        <div className={styles.stockValue}>
          {item.unit_type === 'kusy' ? Math.floor(item.current_stock) : item.current_stock.toFixed(2)}
          <span className={styles.unit}>{item.unit_type === 'litry' ? 'l' : 'ks'}</span>
        </div>
      </div>

      {/* Price */}
      <div className={`${styles.statBox} border-l border-slate-800 pl-8`}>
        <span className={styles.statLabel}>Cena</span>
        <div className={styles.priceValue}>
          {item.selling_price.toFixed(0)}
          <span className="text-xs ml-0.5 opacity-50">Kč</span>
        </div>
      </div>

      {/* Buttons */}
      <div className={styles.btnWrapper}>
        <button 
          onClick={() => onEdit(item)} className={styles.btnEdit}>
          Upravit
        </button>
        <button 
          onClick={() => onDelete(item)} className={styles.btnDelete}>
          Smazat
        </button>
      </div>

    </div>
  </div>
);