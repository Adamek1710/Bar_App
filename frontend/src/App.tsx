import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  deleteItem, addItem, getCurrentInventory, startInventory, updateItem,
  finishInventory, socket, updateInventoryEntry, fetchCurrentStock,
  bulkImportItems
} from './api';
import type { InventoryEntry, Item } from './api';

import { StatusHeader } from './components/StatusHeader';
import { InventoryMode } from './components/InventoryMode';
import { StockMode } from './components/StockMode';

const CLIENT_ID = "frontend-tester-007";

function App() {
  const [inventoryState, setInventoryState] = useState<{ is_running: boolean, entries: InventoryEntry[], sessionId: number | null }>({
    is_running: false, entries: [], sessionId: null
  });
  const [stockItems, setStockItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const totalDiff = useMemo(() => {
    return (inventoryState.entries || []).reduce((sum, entry) => {
        return sum + (entry.difference_value || 0);
        }, 0);
  }, [inventoryState.entries]);
  
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const inv = await getCurrentInventory();
      setInventoryState({ is_running: inv.is_running, entries: inv.entries, sessionId: inv.session?.id || null });
      if (!inv.is_running) setStockItems(await fetchCurrentStock());
    } catch (e) { setError("Chyba komunikace."); }
    setLoading(false);
  }, []);
  
  //HANDLERY PRO STOCK MODE
  const handleAddItem = async (name: string, unit: 'litry' | 'kusy', price: number) => {
    try {
      await addItem(name, unit, price);
      showSuccess("Položka přidána");
      await loadData();
    } catch (e) { setError("Chyba při přidávání položky."); }
  };

  const handleUpdateItem = async (id: number, name: string, unit: 'litry' | 'kusy', price: number, stock: number) => {
    try {
      await updateItem(id, name, unit, price, stock); 
      showSuccess("Položka aktualizována");
      await loadData();
    } catch (e) { setError("Chyba při aktualizaci."); }
  };

  const handleDeleteItem = async (item: Item) => {
    if (!window.confirm(`Opravdu smazat ${item.name}?`)) return;
    try {
      await deleteItem(item.id);
      showSuccess("Smazáno");
      await loadData();
    } catch (e) { setError("Chyba při mazání."); }
  };

  const handleBulkImport = async (data: any[]) => {
    try {
      await bulkImportItems(data);
      showSuccess(`Importováno ${data.length} položek`);
      await loadData();
    } catch (e) { setError("Některé položky se nepodařilo importovat."); }
  };


  useEffect(() => {
    loadData();
    socket.on('entry_updated', (updated: InventoryEntry) => {
      setInventoryState(prev => ({
        ...prev,
        entries: prev.entries.map(e => e.id === updated.id ? updated : e)
      }));
    });
    socket.on('inventory_status_change', loadData);
    return () => {
      socket.off('entry_updated');
      socket.off('inventory_status_change');
    };
  }, [loadData]);

  if (loading) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-blue-500 font-black text-2xl animate-pulse tracking-tighter italic">BAR_CONTROL</div>
    </div>
  );


  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto pb-20">
        
        {/* Notifikace */}
        {successMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-3 rounded-2xl shadow-2xl z-50 animate-bounce font-bold border border-blue-400">
            {successMessage}
          </div>
        )}

        <StatusHeader isRunning={inventoryState.is_running} />

        {error && <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl mb-6 text-red-400">{error}</div>}

        {!inventoryState.is_running ? (
          <StockMode 
            items={stockItems} 
            onStartInventory={() => startInventory(CLIENT_ID).then(loadData)}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onUpdateItem={handleUpdateItem}
            onRefresh={loadData}
            onBulkImport={handleBulkImport}
          />
        ) : (
          <InventoryMode 
            entries={inventoryState.entries}
            totalDiff={totalDiff}
            onUpdate={(id, val) => updateInventoryEntry(id, val, CLIENT_ID)}
            onFinish={() => inventoryState.sessionId && finishInventory(inventoryState.sessionId).then(loadData)}
          />
        )}
      </div>
    </div>
  );
}

export default App;