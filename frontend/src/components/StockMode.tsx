import React, { useState } from 'react';
import type { Item } from '../api';
import { CSVImporter } from './CSVImport';
import { StockCard } from './StockCard';

const styles = {
  wrapper: "space-y-8 animate-in fade-in duration-500 pb-20",
  mainBtn: "w-full bg-blue-600 hover:bg-blue-500 py-8 rounded-3xl font-black text-2xl shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] text-white tracking-tight",
  
  // Tab switch
  tabsWrapper: "flex gap-2 p-1 bg-slate-900 w-fit rounded-2xl border border-slate-800",
  tabBtn: (active: boolean) => `px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`,

  // General
  formCard: "bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl animate-in slide-in-from-left-4 duration-300",
  editCard: "bg-slate-800 p-6 rounded-3xl border-2 border-blue-500 shadow-2xl animate-in zoom-in-95 duration-200",
  
  // Inputs
  inputBase: "w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl focus:border-blue-500 outline-none transition-all text-white placeholder:text-slate-700",
  inputMini: "w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs text-white outline-none focus:border-blue-500",
  labelMini: "text-[8px] font-black text-blue-500 uppercase ml-1 mb-1 block",
  
  // Headers
  sectionHeader: "flex justify-between items-center px-4 mb-4",
  sectionLabel: "text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]"
};

interface Props {
  items: Item[];
  onStartInventory: () => void;
  onAddItem: (name: string, unit: 'litry' | 'kusy', price: number, extra?: any) => Promise<void>;
  onDeleteItem: (item: Item) => void;
  onUpdateItem: (id: number, name: string, unit: 'litry' | 'kusy', price: number, stock: number, extra?: any) => Promise<void>;
  onRefresh: () => void;
  onBulkImport: (data: any[]) => void;
}

export const StockMode: React.FC<Props> = ({ 
  items, onStartInventory, onAddItem, onDeleteItem, onUpdateItem, onRefresh, onBulkImport
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  
  // Adding states
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'litry' | 'kusy'>('litry');
  const [price, setPrice] = useState(0);
  const [fullWeight, setFullWeight] = useState(0);
  const [emptyWeight, setEmptyWeight] = useState(0);
  const [shotWeight, setShotWeight] = useState(0);
  const [shotVolume, setShotVolume] = useState(0.04);

  // Editing states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState<'litry' | 'kusy'>('litry');
  const [editPrice, setEditPrice] = useState(0);
  const [editStock, setEditStock] = useState(0);
  const [editFullWeight, setEditFullWeight] = useState(0);
  const [editEmptyWeight, setEditEmptyWeight] = useState(0);
  const [editShotWeight, setEditShotWeight] = useState(0);
  const [editShotVolume, setEditShotVolume] = useState(0);

  const handleStartEdit = (item: Item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditUnit(item.unit_type);
    setEditPrice(item.selling_price);
    setEditStock(item.current_stock);
    setEditFullWeight(item.full_bottle_weight || 0);
    setEditEmptyWeight(item.empty_bottle_weight || 0);
    setEditShotWeight(item.shot_weight || 0);
    setEditShotVolume(item.shot_volume || 0);
  };

  const handleSaveEdit = async (id: number) => {
    const extra = editUnit === 'litry' ? {
      full_bottle_weight: editFullWeight,
      empty_bottle_weight: editEmptyWeight,
      shot_weight: editShotWeight,
      shot_volume: editShotVolume
    } : {};
    
    await onUpdateItem(id, editName, editUnit, editPrice, editStock, extra);
    setEditingId(null);
  };

  const handleAddNew = async () => {
    const extra = unit === 'litry' ? {
      full_bottle_weight: fullWeight,
      empty_bottle_weight: emptyWeight,
      shot_weight: shotWeight,
      shot_volume: shotVolume
    } : {};

    await onAddItem(name, unit, price, extra);
    // Reset fields
    setName(''); setPrice(0); 
    setFullWeight(0); setEmptyWeight(0); setShotWeight(0); setShotVolume(0.04);
  };

  return (
    <div className={styles.wrapper}>
      <button onClick={onStartInventory} className={styles.mainBtn}>
        SPUSTIT NOVOU INVENTURU
      </button>

      <div className="space-y-4">
        {/* TABY */}
        <div className={styles.tabsWrapper}>
          <button onClick={() => setActiveTab('manual')} className={styles.tabBtn(activeTab === 'manual')}>
            Ruční přidání
          </button>
          <button onClick={() => setActiveTab('import')} className={styles.tabBtn(activeTab === 'import')}>
            Hromadný import
          </button>
        </div>

        {/* FORMS SEKCE */}
        <div className="min-h-[120px]">
          {activeTab === 'manual' ? (
            <div className={styles.formCard}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-5">
                    <input className={styles.inputBase} placeholder="Název produktu..." value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="md:col-span-3">
                    <select className={styles.inputBase} value={unit} onChange={e => setUnit(e.target.value as any)}>
                      <option value="litry">Litry (Alkohol)</option>
                      <option value="kusy">Kusy (Ostatní)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 relative">
                    <input className={`${styles.inputBase} text-right font-bold text-emerald-500`} type="number" value={price || ''} onChange={e => setPrice(parseFloat(e.target.value) || 0)} />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/30 uppercase">Kč</span>
                  </div>
                  <div className="md:col-span-2">
                    <button onClick={handleAddNew} className="w-full h-full bg-white text-black hover:bg-blue-600 hover:text-white rounded-2xl font-black uppercase text-xs transition-all shadow-lg">Přidat</button>
                  </div>
                </div>

                {unit === 'litry' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950 rounded-2xl border border-blue-500/10">
                    <div>
                      <label className={styles.labelMini}>Váha plné (g)</label>
                      <input type="number" className={styles.inputMini} value={fullWeight || ''} onChange={e => setFullWeight(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className={styles.labelMini}>Váha prázdné (g)</label>
                      <input type="number" className={styles.inputMini} value={emptyWeight || ''} onChange={e => setEmptyWeight(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className={styles.labelMini}>Váha panáka (g)</label>
                      <input type="number" className={styles.inputMini} value={shotWeight || ''} onChange={e => setShotWeight(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className={styles.labelMini}>Objem panáka (L)</label>
                      <input type="number" step="0.01" className={styles.inputMini} value={shotVolume || ''} onChange={e => setShotVolume(parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <CSVImporter onImport={async (data) => { await onBulkImport(data); onRefresh(); }} />
          )}
        </div>
      </div>

      {/* VÝPIS SKLADU */}
      <div>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionLabel}>Aktuální sklad</h3>
          <button onClick={onRefresh} className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Aktualizovat data</button>
        </div>

        <div className="grid gap-4">
          {items.map(item => (
            editingId === item.id ? (
              <div key={item.id} className={styles.editCard}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4">
                      <label className={styles.labelMini}>Název produktu</label>
                      <input className={styles.inputBase} value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={styles.labelMini}>Skladem</label>
                      <input className={`${styles.inputBase} text-blue-400 text-center font-mono`} type="number" value={editStock} onChange={e => setEditStock(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={styles.labelMini}>Cena (Kč)</label>
                      <input className={`${styles.inputBase} text-emerald-500 text-right`} type="number" value={editPrice} onChange={e => setEditPrice(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={styles.labelMini}>Jednotka</label>
                      <select className={styles.inputBase} value={editUnit} onChange={e => setEditUnit(e.target.value as any)}>
                        <option value="litry">Litry</option>
                        <option value="kusy">Kusy</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <button onClick={() => handleSaveEdit(item.id)} className="bg-emerald-600 text-white py-2 rounded-xl font-black text-[10px] uppercase">Uložit</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 font-black text-[10px] uppercase">Zrušit</button>
                    </div>
                  </div>

                  {editUnit === 'litry' && (
                    <div className="grid grid-cols-4 gap-4 p-3 bg-slate-900/50 rounded-xl border border-white/5">
                      {/* Zde by šly použít styles.inputMini a styles.labelMini stejně jako nahoře */}
                      <div>
                        <label className={styles.labelMini}>Plná (g)</label>
                        <input type="number" className={styles.inputMini} value={editFullWeight} onChange={e => setEditFullWeight(parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className={styles.labelMini}>Prázdná (g)</label>
                        <input type="number" className={styles.inputMini} value={editEmptyWeight} onChange={e => setEditEmptyWeight(parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className={styles.labelMini}>Panák (g)</label>
                        <input type="number" className={styles.inputMini} value={editShotWeight} onChange={e => setEditShotWeight(parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className={styles.labelMini}>Objem (L)</label>
                        <input type="number" step="0.01" className={styles.inputMini} value={editShotVolume} onChange={e => setEditShotVolume(parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <StockCard key={item.id} item={item} onEdit={handleStartEdit} onDelete={onDeleteItem} />
            )
          ))}
        </div>
      </div>
    </div>
  );
};