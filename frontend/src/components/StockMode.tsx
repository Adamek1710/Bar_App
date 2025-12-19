import React, { useState } from 'react';
import type { Item } from '../api';
import { CSVImporter } from './CSVImport';

interface Props {
  items: Item[];
  onStartInventory: () => void;
  onAddItem: (name: string, unit: 'litry' | 'kusy', price: number) => Promise<void>;
  onDeleteItem: (item: Item) => void;
  onUpdateItem: (id: number, name: string, unit: 'litry' | 'kusy', price: number, stock: number) => Promise<void>;
  onRefresh: () => void;
}

export const StockMode: React.FC<Props> = ({ 
  items, 
  onStartInventory, 
  onAddItem, 
  onDeleteItem, 
  onUpdateItem,
  onRefresh 
}) => {
  // Přepínač mezi ručním přidáním a importem
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');

  // Stavy pro novou položku
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'litry' | 'kusy'>('litry');
  const [price, setPrice] = useState(0);

  // Stavy pro editaci existující položky
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
  const finalStock = editUnit === 'kusy' ? Math.round(editStock) : editStock;
  const finalPrice = Math.round(editPrice);

  await onUpdateItem(id, editName, editUnit, finalPrice, finalStock);
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
                <input 
                  className="md:col-span-5 bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl focus:border-blue-500 outline-none transition-all" 
                  placeholder="Název produktu..." 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
                <select 
                  className="md:col-span-3 bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl focus:border-blue-500 outline-none" 
                  value={unit} 
                  onChange={e => setUnit(e.target.value as any)}
                >
                  <option value="litry">Litry</option>
                  <option value="kusy">Kusy</option>
                </select>
                <div className="md:col-span-2 relative">
                  <input 
                    className="w-full bg-slate-950 border-2 border-slate-800 p-4 rounded-2xl focus:border-emerald-500 outline-none text-right font-bold text-emerald-500" 
                    type="number" 
                    value={price || ''} 
                    onChange={e => setPrice(parseFloat(e.target.value) || 0)} 
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 uppercase text-white/50">Kč</span>
                </div>
                <button 
                  onClick={async () => { await onAddItem(name, unit, price); setName(''); setPrice(0); }} 
                  className="md:col-span-2 bg-white text-black hover:bg-blue-600 hover:text-white rounded-2xl font-black uppercase text-xs transition-all"
                >
                  Přidat
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <CSVImporter onImport={async (data) => {
                onRefresh();
              }} />
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 text-[9px] uppercase font-black text-slate-500 tracking-[0.15em]">
            <tr>
              <th className="p-6">Produkt</th>
              <th className="p-6 text-center">Aktuální stav</th>
              <th className="p-6 text-center">Prodejní cena</th>
              <th className="p-6 text-right">Akce</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-200">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-blue-500/[0.03] transition-colors group">
                {editingId === item.id ? (
                  /* EDITAČNÍ ŘÁDEK */
                  <>
                    <td className="p-4">
                      <input 
                        className="w-full bg-slate-950 border-2 border-blue-500/30 p-3 rounded-xl font-bold focus:border-blue-500 outline-none" 
                        value={editName} 
                        onChange={e => setEditName(e.target.value)} 
                      />
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        <input 
                          className="w-24 bg-slate-950 border-2 border-blue-500/30 p-3 rounded-xl text-blue-400 font-bold text-center text-xl outline-none focus:border-blue-400" 
                          type="number" 
                          step={editUnit === 'kusy' ? '1' : '0.01'} 
                          value={editStock} 
                          onChange={e => setEditStock(parseFloat(e.target.value) || 0)} 
                        />
                        <span className="text-[8px] text-slate-500 uppercase mt-2 font-black tracking-widest">{editUnit === 'kusy' ? 'Celé kusy' : 'Desetiny (L)'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-center">
                        <input 
                          className="w-24 bg-slate-950 border-2 border-emerald-500/30 p-3 rounded-xl text-emerald-500 font-bold text-right text-xl outline-none focus:border-emerald-500" 
                          type="number" 
                          value={editPrice} 
                          onChange={e => setEditPrice(parseFloat(e.target.value) || 0)} 
                        />
                        <select 
                          className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs font-bold" 
                          value={editUnit} 
                          onChange={e => setEditUnit(e.target.value as any)}
                        >
                          <option value="litry">l</option>
                          <option value="kusy">ks</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button onClick={() => handleSaveEdit(item.id)} className="bg-emerald-600/20 text-emerald-500 px-4 py-2 rounded-lg font-black text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-900/10">Uložit</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-500 font-black text-[10px] uppercase hover:text-white">Zrušit</button>
                    </td>
                  </>
                ) : (
                  /* STANDARDNÍ ŘÁDEK */
                  <>
                    <td className="p-6">
                      <div className="font-black text-white uppercase group-hover:text-blue-400 transition-colors tracking-tight text-lg leading-tight">{item.name}</div>
                      <div className="text-[10px] text-slate-600 font-bold uppercase mt-1 italic tracking-wider opacity-60">ID: #{item.id}</div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="inline-block bg-slate-950/50 border border-slate-800/50 px-6 py-3 rounded-2xl shadow-inner group-hover:border-blue-500/20 transition-all">
                        <span className="text-3xl font-black text-blue-500 font-mono tracking-tighter">
                          {/* Logika zaokrouhlení pro zobrazení */}
                          {item.unit_type === 'kusy' 
                            ? Math.floor(item.current_stock) 
                            : item.current_stock.toFixed(2)}
                        </span>
                        <span className="ml-2 text-[10px] font-black text-slate-600 uppercase">{item.unit_type === 'litry' ? 'l' : 'ks'}</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="text-3xl font-black text-emerald-500 tracking-tighter">
                        {item.selling_price.toFixed(0)}
                        <span className="text-sm ml-1 opacity-50 font-normal">Kč</span>
                      </div>
                      <div className="text-[8px] text-slate-700 font-black uppercase mt-1">za jednotku</div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <button onClick={() => handleStartEdit(item)} className="text-blue-500 hover:text-white hover:bg-blue-500 px-3 py-1.5 rounded-md font-black text-[10px] uppercase transition-all tracking-widest border border-blue-500/20">Upravit</button>
                        <button onClick={() => onDeleteItem(item)} className="text-slate-700 hover:text-red-500 px-3 py-1.5 rounded-md font-black text-[10px] uppercase transition-all tracking-widest">Smazat</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};