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
import { MenuManager } from './MenuManager';
import { useAuth } from './auth/AuthContext';

const CLIENT_ID = "frontend-tester-007";

const styles = {
  layout: "min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8",
  container: "max-w-4xl mx-auto pb-20",
  
  settingsBtn: "text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-500 transition-colors",
  backBtn: "fixed top-4 left-4 z-50 bg-slate-800 p-2 rounded-full text-xs hover:bg-slate-700 transition-colors",
  logoutBtn: "fixed top-4 right-4 z-50 bg-red-600 p-2 rounded-full text-xs hover:bg-red-700 transition-colors text-white",
  
  // Notifications and states
  toast: "fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-3 rounded-2xl shadow-2xl z-50 animate-bounce font-bold border border-blue-400",
  error: "bg-red-500/10 border border-red-500/50 p-4 rounded-xl mb-6 text-red-400",
  
  // Loader
  loaderWrapper: "h-screen bg-slate-950 flex items-center justify-center",
  loaderText: "text-blue-500 font-black text-2xl animate-pulse tracking-tighter italic"
};

const AppContent: React.FC = () => {
  const { user, logout, isOwner } = useAuth();
  const path = window.location.pathname;
  
  if (path === '/menu') return <MenuManager adminMode={false} />;

  if (path === '/menu-admin' && isOwner) {
    return (
      <div className={styles.layout}>
        <button onClick={() => window.location.pathname = '/'} className={styles.backBtn}>
          ← Zpět do skladu
        </button>
        <MenuManager adminMode={true} />
      </div>
    );
  }

  // --- STATE ---
  const [inventoryState, setInventoryState] = useState<{ is_running: boolean, entries: InventoryEntry[], sessionId: number | null }>({
    is_running: false, entries: [], sessionId: null
  });
  const [stockItems, setStockItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- LOGIC ---
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
    console.log('AppContent: Loading data...');
    try {
      console.log('AppContent: Making getCurrentInventory call...');
      const inv = await getCurrentInventory();
      console.log('AppContent: getCurrentInventory response:', inv);
      setInventoryState({ is_running: inv.is_running, entries: inv.entries, sessionId: inv.session?.id || null });
      if (!inv.is_running) {
        console.log('AppContent: Making fetchCurrentStock call...');
        const stock = await fetchCurrentStock();
        console.log('AppContent: fetchCurrentStock response:', stock);
        setStockItems(stock);
      }
    } catch (e) { 
      console.error('AppContent: Load data error:', e);
      setError("Chyba komunikace."); 
    }
    setLoading(false);
  }, []);
  
  // --- HANDLERS ---
  const handleAddItem = async (name: string, unit: 'litry' | 'kusy', price: number, extra?: any) => {
    console.log('AppContent: Adding item:', { name, unit, price, extra });
    try {
      await addItem(name, unit, price, extra);
      showSuccess("Položka přidána");
      await loadData();
    } catch (e) { 
      console.error('AppContent: Add item error:', e);
      setError("Chyba při přidávání položky."); 
    }
  };

  const handleUpdateItem = async (
    id: number,
    name: string,
    unit: 'litry' | 'kusy', 
    price: number, 
    stock: number,
    extra?: any
  ) => {
    try {
      await updateItem(id, name, unit, price, stock, extra); 
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

  // --- EFFECTS ---
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
    <div className={styles.loaderWrapper}>
      <div className={styles.loaderText}>BAR_CONTROL</div>
    </div>
  );

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        {/* User info and logout */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-slate-500 text-sm">
            Přihlášen: <strong>{user?.username}</strong> ({user?.role})
          </div>
          <button onClick={logout} className={styles.logoutBtn}>
            Odhlásit se
          </button>
        </div>

        {/* Settings button for owners */}
        {isOwner && (
          <button 
            onClick={() => window.location.pathname = '/menu-admin'}
            className={styles.settingsBtn}
          >
            ⚙️ Upravit Nápojový lístek
          </button>
        )}

        {/* Notifikace */}
        {successMessage && <div className={styles.toast}>{successMessage}</div>}

        <StatusHeader isRunning={inventoryState.is_running} />

        {error && <div className={styles.error}>{error}</div>}

        {!inventoryState.is_running ? (
          <StockMode 
            items={stockItems} 
            onStartInventory={() => startInventory(CLIENT_ID).then(loadData)}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onUpdateItem={handleUpdateItem}
            onRefresh={loadData}
            onBulkImport={handleBulkImport}
            // Hide admin features from employees
            showAdminFeatures={isOwner}
          />
        ) : (
          <InventoryMode 
            entries={inventoryState.entries}
            totalDiff={totalDiff}
            onUpdate={(id, qty, weight) => updateInventoryEntry(id, qty, weight, CLIENT_ID)}
            onFinish={() => inventoryState.sessionId && finishInventory(inventoryState.sessionId).then(loadData)}
          />
        )}
      </div>
    </div>
  );
};

export default AppContent;
