import React, { useState } from 'react';
import type { Item } from '../api';
import { CSVImporter } from './CSVImport';
import { StockCard } from './StockCard';
import { ExcelExporter } from './CSVExport';

const styles = {
  wrapper: "space-y-8 animate-in fade-in duration-500 pb-20",
  mainBtn: "w-full bg-blue-600 hover:bg-blue-500 py-8 rounded-3xl font-black text-2xl shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] text-white tracking-tight",
  
  tabsWrapper: "flex gap-2 p-1 bg-slate-900 w-fit rounded-2xl border border-slate-800",
  tabBtn: (active: boolean) => `px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`,

  // Form styles
  cardBase: "p-6 rounded-3xl border shadow-xl transition-all duration-300",
  cardAdd: "bg-slate-900 border-slate-800 animate-in slide-in-from-left-4",
  cardEdit: "bg-slate-800 border-blue-500/50 ring-1 ring-blue-500/20 animate-in zoom-in-95",
  
  // Grid
  formGrid: "grid grid-cols-1 md:grid-cols-12 gap-4 items-end",
  
  // Inputs
  fieldWrapper: "flex flex-col gap-1.5",
  label: "text-[9px] font-black text-slate-500 uppercase tracking-wider ml-1",
  input: "w-full bg-slate-950 border-2 border-slate-800/50 p-3 rounded-2xl focus:border-blue-500 outline-none transition-all text-white placeholder:text-slate-700 font-bold",
  
  // Weight section
  extraGrid: "grid grid-cols-2 md:grid-cols-4 gap-4 p-4 mt-4 bg-black/20 rounded-2xl border border-white/5",
  
  // Buttons
  btnPrimary: "w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-black uppercase text-xs transition-all shadow-lg active:scale-95",
  btnSuccess: "w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl font-black uppercase text-xs transition-all shadow-lg active:scale-95",
  btnGhost: "w-full text-slate-500 hover:text-white py-2 font-black uppercase text-[10px] transition-colors",

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
  items, onStartInventory, onAddItem, onDeleteItem, onUpdateItem, onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'import' | 'export'>('manual');
  
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

      {/* --- ADDING --- */}
      <div className="space-y-4">
        <div className={styles.tabsWrapper}>
          <button onClick={() => setActiveTab('manual')} className={styles.tabBtn(activeTab === 'manual')}>Ruční přidání</button>
          <button onClick={() => setActiveTab('import')} className={styles.tabBtn(activeTab === 'import')}>Hromadný import</button>
          <button onClick={() => setActiveTab('export')} className={styles.tabBtn(activeTab === 'export')}>Hromadný export</button>
        </div>

        {activeTab === 'manual' && (
          <div className={`${styles.cardBase} ${styles.cardAdd}`}>
            <div className={styles.formGrid}>
              <div className="md:col-span-5 border-l-2 border-blue-500 pl-4">
                <label className={styles.label}>Název produktu</label>
                <input className={styles.input} placeholder="Např. Jameson 1L..." value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="md:col-span-3">
                <label className={styles.label}>Jednotka</label>
                <select className={styles.input} value={unit} onChange={e => setUnit(e.target.value as any)}>
                  <option value="litry">Litry (Alkohol)</option>
                  <option value="kusy">Kusy (Ostatní)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={styles.label}>Prodejní cena</label>
                <input className={`${styles.input} text-emerald-500`} type="number" value={price || ''} onChange={e => setPrice(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="md:col-span-2">
                <button onClick={handleAddNew} className={styles.btnPrimary}>Přidat</button>
              </div>
            </div>

            {unit === 'litry' && (
              <div className={styles.extraGrid}>
                <div className={styles.fieldWrapper}><label className={styles.label}>Plná láhev (g)</label><input type="number" className={styles.input} value={fullWeight || ''} onChange={e => setFullWeight(parseFloat(e.target.value) || 0)} /></div>
                <div className={styles.fieldWrapper}><label className={styles.label}>Prázdná (g)</label><input type="number" className={styles.input} value={emptyWeight || ''} onChange={e => setEmptyWeight(parseFloat(e.target.value) || 0)} /></div>
                <div className={styles.fieldWrapper}><label className={styles.label}>Váha panáka (g)</label><input type="number" className={styles.input} value={shotWeight || ''} onChange={e => setShotWeight(parseFloat(e.target.value) || 0)} /></div>
                <div className={styles.fieldWrapper}><label className={styles.label}>Objem (L)</label><input type="number" step="0.01" className={styles.input} value={shotVolume || ''} onChange={e => setShotVolume(parseFloat(e.target.value) || 0)} /></div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'import' && (
          <CSVImporter onImport={async () => { await onRefresh(); }} />
        )}
        {activeTab === 'export' && (
          <ExcelExporter />
        )}
      </div>

      {/* --- LIST AND EDIT--- */}
      <div className="space-y-4">
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionLabel}>Aktuální sklad</h3>
          <button onClick={onRefresh} className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Aktualizovat data</button>
        </div>

        <div className="grid gap-4">
          {items.map(item => (
            editingId === item.id ? (
              
              /* --- EDIT FORM --- */
              <div key={item.id} className={`${styles.cardBase} ${styles.cardEdit}`}>
                <div className={styles.formGrid}>
                  <div className="md:col-span-4 border-l-2 border-blue-400 pl-4">
                    <label className={styles.label}>Název produktu</label>
                    <input className={styles.input} value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={styles.label}>Skladem</label>
                    <input className={`${styles.input} text-blue-400 font-mono`} type="number" value={editStock} onChange={e => setEditStock(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={styles.label}>Cena (Kč)</label>
                    <input className={`${styles.input} text-emerald-500`} type="number" value={editPrice} onChange={e => setEditPrice(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={styles.label}>Jednotka</label>
                    <select className={styles.input} value={editUnit} onChange={e => setEditUnit(e.target.value as any)}>
                      <option value="litry">Litry</option>
                      <option value="kusy">Kusy</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <button onClick={() => handleSaveEdit(item.id)} className={styles.btnSuccess}>Uložit</button>
                    <button onClick={() => setEditingId(null)} className={styles.btnGhost}>Zrušit</button>
                  </div>
                </div>

                {editUnit === 'litry' && (
                  <div className={styles.extraGrid}>
                    <div className={styles.fieldWrapper}><label className={styles.label}>Plná (g)</label><input type="number" className={styles.input} value={editFullWeight} onChange={e => setEditFullWeight(parseFloat(e.target.value) || 0)} /></div>
                    <div className={styles.fieldWrapper}><label className={styles.label}>Prázdná (g)</label><input type="number" className={styles.input} value={editEmptyWeight} onChange={e => setEditEmptyWeight(parseFloat(e.target.value) || 0)} /></div>
                    <div className={styles.fieldWrapper}><label className={styles.label}>Panák (g)</label><input type="number" className={styles.input} value={editShotWeight} onChange={e => setEditShotWeight(parseFloat(e.target.value) || 0)} /></div>
                    <div className={styles.fieldWrapper}><label className={styles.label}>Objem (L)</label><input type="number" step="0.01" className={styles.input} value={editShotVolume} onChange={e => setEditShotVolume(parseFloat(e.target.value) || 0)} /></div>
                  </div>
                )}
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