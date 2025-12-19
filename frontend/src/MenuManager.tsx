import React, { useState, useEffect } from 'react';

// Typ pro položku v menu
interface MenuItem {
  id: string;
  category: string;
  name: string;
  volume: string;
  price: number;
}

export const MenuManager = ({ adminMode = false }) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState({ category: '', name: '', volume: '', price: 0 });

  useEffect(() => {
    const savedMenu = localStorage.getItem('bar_public_menu');
    if (savedMenu) setMenu(JSON.parse(savedMenu));
  }, []);

  const saveMenu = (updatedMenu: MenuItem[]) => {
    setMenu(updatedMenu);
    localStorage.setItem('bar_public_menu', JSON.stringify(updatedMenu));
  };

  const addItem = () => {
    if (!newItem.name || !newItem.category) return;
    const itemWithId = { ...newItem, id: Date.now().toString() };
    saveMenu([...menu, itemWithId]);
    setNewItem({ category: newItem.category, name: '', volume: '', price: 0 });
  };

  const removeItem = (id: string) => {
    saveMenu(menu.filter(item => item.id !== id));
  };

  const categories = Array.from(new Set(menu.map(i => i.category)));

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-black italic mb-8 text-center">
          BAR<span className="text-blue-500">MENU</span>
          {adminMode && <span className="block text-xs text-red-500 not-italic uppercase tracking-widest">Režim úprav</span>}
        </h1>

        {adminMode && (
          <div className="bg-slate-900 p-4 rounded-2xl mb-10 border border-blue-500/30">
            <input 
              placeholder="Kategorie (např. Pivo)" 
              className="w-full bg-black p-2 rounded mb-2 border border-slate-800"
              value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}
            />
            <input 
              placeholder="Název nápoje" 
              className="w-full bg-black p-2 rounded mb-2 border border-slate-800"
              value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}
            />
            <div className="flex gap-2">
              <input 
                placeholder="Míra" className="w-1/2 bg-black p-2 rounded border border-slate-800"
                value={newItem.volume} onChange={e => setNewItem({...newItem, volume: e.target.value})}
              />
              <input 
                type="number" placeholder="Cena" className="w-1/2 bg-black p-2 rounded border border-slate-800"
                onChange={e => setNewItem({...newItem, price: parseInt(e.target.value)})}
              />
            </div>
            <button onClick={addItem} className="w-full bg-blue-600 mt-4 py-2 rounded-xl font-bold">Přidat do lístku</button>
          </div>
        )}

        {categories.map(cat => (
          <div key={cat} className="mb-8">
            <h2 className="text-blue-500 text-sm font-black uppercase tracking-widest border-b border-slate-800 pb-1 mb-4">{cat}</h2>
            {menu.filter(i => i.category === cat).map(item => (
              <div key={item.id} className="flex justify-between items-center mb-4 group">
                <div>
                  <div className="font-bold">{item.name} <span className="text-[10px] text-slate-500 font-normal">{item.volume}</span></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold">{item.price},-</span>
                  {adminMode && (
                    <button onClick={() => removeItem(item.id)} className="text-red-500 text-xs">✕</button>
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