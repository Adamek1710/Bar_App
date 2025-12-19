import React, { useState } from 'react';
import type { Item } from '../api';
import { CSVImporter } from './CSVImport';
import { StockCard } from './StockCard';

interface Props {
  items: Item[];
  onStartInventory: () => void;
  onAddItem: (name: string, unit: 'litry' | 'kusy', price: number) => Promise<void>;
  onDeleteItem: (item: Item) => void;
  onUpdateItem: (id: number, name: string, unit: 'litry' | 'kusy', price: number, stock: number) => Promise<void>;
  onRefresh: () => void;
  onBulkImport: (data: any[]) => void;
}

export const StockMode: React.FC<Props> = ({ 
  items, onStartInventory, onAddItem, onDeleteItem, onUpdateItem, onRefresh, onBulkImport
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'litry' | 'kusy'>('litry');
  const [price, setPrice] = useState(0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState<'litry' | 'kusy'>('litry');
  const [editPrice, setEditPrice] = useState(0);
  const [editStock, setEditStock] = useState(0);

  const handleStartEdit = (item: Item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditUnit(item.unit_type);
    setEditPrice(item.selling_price);
    setEditStock(item.current_stock);
  };

  const handleSaveEdit = async (id: number) => {
    await onUpdateItem(id, editName, editUnit, editPrice, editStock);
    setEditingId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <button 
        onClick={onStartInventory} 
        className="w-full bg-blue-600 hover:bg-blue-500 py-8 rounded-3xl font-black text-2xl shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] text-white tracking-tight"
      >
        SPUSTIT NOVOU INVENTURU
      </button>

      <div className="space-y-4">
        <div className="flex gap-2 p-1 bg-slate-900 w-fit rounded-2xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'manual' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Ruční přidání
          </button>
          <button 
            onClick={() => setActiveTab('import')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'import' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Hromadný import (CSV)
          </button>
        </div>

       <div className="min-h-[120px]">
        {activeTab === 'manual' ? (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl animate-in slide-in-from-left-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              <div className="md:col-span-5 flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-2 md:hidden">Název produktu</label>
                <input 
                  className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl focus:border-blue-500 outline-none transition-all text-white placeholder:text-slate-700" 
                  placeholder="Např. Rumíček..." 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>

              <div className="md:col-span-5 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2 md:hidden">Jednotka</label>
                  <select 
                    className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl focus:border-blue-500 outline-none text-white appearance-none" 
                    value={unit} 
                    onChange={e => setUnit(e.target.value as any)}
                  >
                    <option value="litry">Litry (L)</option>
                    <option value="kusy">Kusy (KS)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2 md:hidden">Prodejní cena</label>
                  <div className="relative">
                    <input 
                      className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl focus:border-emerald-500 outline-none text-right font-bold text-emerald-500" 
                      type="number"
                      inputMode="decimal" 
                      value={price || ''} 
                      onChange={e => setPrice(parseFloat(e.target.value) || 0)} 
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/30 uppercase">Kč</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex items-end">
                <button 
                  onClick={async () => { await onAddItem(name, unit, price); setName(''); setPrice(0); }} 
                  className="w-full h-[60px] md:h-full bg-white text-black hover:bg-blue-600 hover:text-white rounded-2xl font-black uppercase text-xs transition-all shadow-lg active:scale-95"
                >
                  Přidat
                </button>
              </div>

            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <CSVImporter onImport={async (data) => {
              await onBulkImport(data);
              onRefresh();
            }} />
          </div>
        )}
      </div>
      </div>

      <div className="space-y-4 pb-20">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">Aktuální sklad</h3>
          <button onClick={onRefresh} className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Aktualizovat data</button>
        </div>

        <div className="grid gap-4">
          {items.map(item => (
            editingId === item.id ? (
              /* EDITAČNÍ KARTA */
              <div key={item.id} className="bg-slate-800 p-6 rounded-3xl border-2 border-blue-500 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-4">
                    <label className="text-[8px] font-black text-blue-400 uppercase ml-2 mb-1 block">Název produktu</label>
                    <input 
                      className="w-full bg-slate-950 border-2 border-slate-700 p-3 rounded-xl font-bold text-white outline-none focus:border-blue-500" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[8px] font-black text-blue-400 uppercase ml-2 mb-1 block">Stav na skladě</label>
                    <input 
                      className="w-full bg-slate-950 border-2 border-slate-700 p-3 rounded-xl text-blue-400 font-mono font-bold text-center outline-none focus:border-blue-500" 
                      type="number" 
                      step={editUnit === 'kusy' ? '1' : '0.01'} 
                      value={editStock} 
                      onChange={e => setEditStock(parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[8px] font-black text-blue-400 uppercase ml-2 mb-1 block">Prodejní cena</label>
                    <input 
                      className="w-full bg-slate-950 border-2 border-slate-700 p-3 rounded-xl text-emerald-500 font-bold text-right outline-none focus:border-emerald-500" 
                      type="number" 
                      value={editPrice} 
                      onChange={e => setEditPrice(parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[8px] font-black text-blue-400 uppercase ml-2 mb-1 block">Jednotka</label>
                    <select 
                      className="w-full bg-slate-950 border-2 border-slate-700 p-3 rounded-xl text-xs font-bold text-white outline-none" 
                      value={editUnit} 
                      onChange={e => setEditUnit(e.target.value as any)}
                    >
                      <option value="litry">Litry (L)</option>
                      <option value="kusy">Kusy (KS)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <button onClick={() => handleSaveEdit(item.id)} className="w-full bg-emerald-600 text-white py-2 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20">Uložit</button>
                    <button onClick={() => setEditingId(null)} className="w-full text-slate-400 font-black text-[10px] uppercase hover:text-white transition-all">Zrušit</button>
                  </div>
                </div>
              </div>
            ) : (
              /* STANDARDNÍ KARTA */
              <StockCard 
                key={item.id} 
                item={item} 
                onEdit={handleStartEdit} 
                onDelete={onDeleteItem} 
              />
            )
          ))}
        </div>
      </div>
    </div>
  );
};