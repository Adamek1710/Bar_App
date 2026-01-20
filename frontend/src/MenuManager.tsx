import React, { useState, useEffect } from 'react';
import { fetchPublicMenu, addPublicMenuItem, deletePublicMenuItem } from './api';

const styles = {
  wrapper: "min-h-screen bg-black text-white p-6 pb-24",
  container: "max-w-md mx-auto",
  
  // HEADER
  header: "text-4xl font-black italic mb-8 text-center",
  adminBadge: "block text-xs text-red-500 not-italic uppercase tracking-widest",
  
  // Admin box
  adminBox: "bg-slate-900 p-4 rounded-2xl mb-10 border border-blue-500/30",
  input: "w-full bg-black p-2 rounded mb-2 border border-slate-800 focus:border-blue-500 outline-none transition-colors",
  inputSmall: "w-1/2 bg-black p-2 rounded border border-slate-800 focus:border-blue-500 outline-none transition-colors",
  addBtn: "w-full bg-blue-600 hover:bg-blue-500 mt-4 py-2 rounded-xl font-bold transition-colors",
  
  // Menu Item
  categoryTitle: "text-blue-500 text-sm font-black uppercase tracking-widest border-b border-slate-800 pb-1 mb-4",
  itemRow: "flex justify-between items-center mb-4 group",
  itemName: "font-bold",
  itemVolume: "text-[10px] text-slate-500 font-normal ml-1",
  itemPrice: "font-mono font-bold",
  removeBtn: "text-red-500 text-xs hover:scale-125 transition-transform p-1"
};

interface MenuItem {
  id: number;
  category: string;
  name: string;
  volume: string;
  price: number;
}

export const MenuManager = ({ adminMode = false }) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState({ category: '', name: '', volume: '', price: 0 });

  useEffect(() => {
    fetchPublicMenu().then(setMenu);
  }, []);

  const addItem = async () => {
    if (!newItem.name || !newItem.category) return;
    const savedItem = await addPublicMenuItem(newItem);
    setMenu([...menu, savedItem]);
    setNewItem({ category: newItem.category, name: '', volume: '', price: 0 });
  };

  const removeItem = async (id: number) => {
    await deletePublicMenuItem(id);
    setMenu(menu.filter(item => item.id !== id));
  };

  const categories = Array.from(new Set(menu.map(i => i.category)));

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.header}>
          BAR<span className="text-blue-500">MENU</span>
          {adminMode && <span className={styles.adminBadge}>Režim úprav</span>}
        </h1>

        {adminMode && (
          <div className={styles.adminBox}>
            <input 
              placeholder="Kategorie (např. Pivo)" 
              className={styles.input}
              value={newItem.category} 
              onChange={e => setNewItem({...newItem, category: e.target.value})}
            />
            <input 
              placeholder="Název nápoje" 
              className={styles.input}
              value={newItem.name} 
              onChange={e => setNewItem({...newItem, name: e.target.value})}
            />
            <div className="flex gap-2">
              <input 
                placeholder="Míra" 
                className={styles.inputSmall}
                value={newItem.volume} 
                onChange={e => setNewItem({...newItem, volume: e.target.value})}
              />
              <input 
                type="number"
                placeholder="Cena" 
                className={styles.inputSmall}
                onChange={e => setNewItem({...newItem, price: parseInt(e.target.value)})}
              />
            </div>
            <button onClick={addItem} className={styles.addBtn}>Přidat do lístku</button>
          </div>
        )}

        {categories.map(cat => (
          <div key={cat} className="mb-8">
            <h2 className={styles.categoryTitle}>{cat}</h2>

            {menu.filter(i => i.category === cat).map(item => (
              <div key={item.id} className={styles.itemRow}>
                <div>
                  <div className={styles.itemName}>{item.name} 
                    <span className={styles.itemVolume}>{item.volume}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={styles.itemPrice}>{item.price},-</span>
                  {adminMode && (
                    <button onClick={() => removeItem(item.id)} className={styles.removeBtn}>✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};