import React from 'react';
import type { Item } from '../api';

const styles = {
  card: "bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-blue-500/30 transition-all shadow-lg",
  
  // Info section
  infoWrapper: "flex-1 text-center md:text-left",
  itemName: "font-black text-white uppercase text-xl group-hover:text-blue-400 transition-colors tracking-tight",
  
  // Technical info
  metaWrapper: "flex flex-wrap justify-center md:justify-start items-center gap-3 mt-2",
  itemId: "text-[10px] text-slate-600 font-bold uppercase italic tracking-wider",
  metaBadge: "text-[9px] text-slate-500 font-bold uppercase bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50",

  // Values
  actionsWrapper: "flex flex-wrap justify-center items-center gap-6 md:gap-8",
  statBox: "text-center md:text-right flex flex-col items-center md:items-end",
  statLabel: "text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 block",
  
  // Big numbers
  weightValue: "text-2xl font-black text-orange-500 font-mono tracking-tighter leading-none",
  stockValue: "text-3xl font-black text-blue-500 font-mono tracking-tighter leading-none",
  priceValue: "text-2xl font-black text-emerald-500 tracking-tighter leading-none",
  unit: "text-[10px] ml-1 text-slate-600 uppercase font-bold",
  
  // Buttons
  btnWrapper: "flex flex-col gap-2 md:ml-4",
  btnEdit: "text-blue-500 hover:text-white hover:bg-blue-500 px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest border border-blue-500/20",
  btnDelete: "text-slate-700 hover:text-red-500 px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest"
};

interface StockCardProps {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  showAdminFeatures?: boolean;
}

export const StockCard: React.FC<StockCardProps> = ({ item, onEdit, onDelete, showAdminFeatures = true }) => (
  <div className={styles.card}>

    {/* Info section*/}
    <div className={styles.infoWrapper}>
      <div className={styles.itemName}>{item.name}</div>
      
      <div className={styles.metaWrapper}>
        <div className={styles.itemId}>ID: #{item.id}</div>
        
        {item.unit_type === 'litry' && (
          <>
            <span className="text-slate-800 text-xs">•</span>
            <div className={styles.metaBadge}>
              Plná: {item.full_bottle_weight}g
            </div>
            <div className={styles.metaBadge}>
              Objem: {item.shot_volume}L
            </div>
          </>
        )}
      </div>
    </div>
    
    {/* Values section */}
    <div className={styles.actionsWrapper}>
      
      {/* Current Weight */}
      {item.unit_type === 'litry' && (
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Váha láhve</span>
          <div className={styles.weightValue}>
            {item.current_weight || 0}<span className={styles.unit}>g</span>
          </div>
        </div>
      )}

      {/* Stock Value */}
      <div className={`${styles.statBox} ${item.unit_type === 'litry' ? 'border-l border-slate-800 pl-6 md:pl-8' : ''}`}>
        <span className={styles.statLabel}>Celkem skladem</span>
        <div className={styles.stockValue}>
          {item.unit_type === 'kusy' ? Math.floor(item.current_stock) : item.current_stock.toFixed(2)}
          <span className={styles.unit}>{item.unit_type === 'litry' ? 'l' : 'ks'}</span>
        </div>
      </div>

      {/* Price */}
      <div className={`${styles.statBox} border-l border-slate-800 pl-6 md:pl-8`}>
        <span className={styles.statLabel}>Cena</span>
        <div className={styles.priceValue}>
          {item.selling_price.toFixed(0)}
          <span className="text-xs ml-0.5 opacity-50">Kč</span>
        </div>
      </div>

      {/* Actions */}
      {showAdminFeatures && (
        <div className={styles.btnWrapper}>
          <button onClick={() => onEdit(item)} className={styles.btnEdit}>
            Upravit
          </button>
          <button onClick={() => onDelete(item)} className={styles.btnDelete}>
            Smazat
          </button>
        </div>
      )}

    </div>
  </div>
);