import React, { useState, useEffect, useCallback } from 'react';
import { deleteItem, updateItem, addItem, getCurrentInventory, startInventory, finishInventory, socket, updateInventoryEntry, fetchCurrentStock} from './api';
import type { InventoryEntry, Item } from './api';

const CLIENT_ID = "frontend-tester-007"; 

function App() {
  const [inventoryState, setInventoryState] = useState<{ is_running: boolean, entries: InventoryEntry[], sessionId: number | null }>({
    is_running: false,
    entries: [],
    sessionId: null
  });
  const [stockItems, setStockItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnitType, setNewItemUnitType] = useState<'litry' | 'kusy'>('litry');
  const [newItemSellingPrice, setNewItemSellingPrice] = useState(0.0);

  const [editingItemId, setEditingItemId] = useState<number | null>(null); 
  const [currentEditItem, setCurrentEditItem] = useState<Item | null>(null);



  const handleStartEdit = (item: Item) => {
    setEditingItemId(item.id);
    setCurrentEditItem(item); 
    setError(null); 
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setCurrentEditItem(null);
  };

  const handleSaveEdit = async () => {
    if (!currentEditItem) return;

    try {
        const updatedItem = await updateItem(
            currentEditItem.id,
            currentEditItem.name,
            currentEditItem.unit_type,
            currentEditItem.selling_price
        );

        // Aktualizuje pole stockItems novou položkou
        setStockItems(prev => prev.map(item => 
            item.id === updatedItem.id ? updatedItem : item
        ));
        
        setEditingItemId(null);
        setCurrentEditItem(null);
        setError(null);
        showSuccessMessage(`Položka '${updatedItem.name}' byla úspěšně aktualizována.`);
    } catch (err) {
        setError("Chyba při ukládání položky. Zkontrolujte, zda jméno neexistuje.");
        console.error(err);
    }
  };

  const handleDeleteItem = async (item: Item) => {
    if (!window.confirm(`Opravdu chcete smazat položku '${item.name}'? Tato akce je nevratná.`)) {
        return;
    }

    try {
        await deleteItem(item.id);
        
        // Odstraní položku z pole stockItems
        setStockItems(prev => prev.filter(i => i.id !== item.id));

        setError(null);
        showSuccessMessage(`Položka '${item.name}' byla smazána.`);
    } catch (err) {
        setError("Chyba při mazání položky. (Možná je stále v nějaké inventuře?)");
        console.error(err);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName || newItemSellingPrice <= 0) {
        setError('Prosím, zadejte jméno položky a kladnou prodejní cenu.');
        return;
    }

    try {
      const newItem = await addItem(newItemName, newItemUnitType, newItemSellingPrice);
      
      setError(null);

      setNewItemName('');
      setNewItemSellingPrice(0.0);
      
      if (!inventoryState.is_running) {
        setStockItems(prev => [...prev, newItem]); 
      }
      
      showSuccessMessage(`Položka '${newItem.name}' byla úspěšně přidána.`);
    } catch (err) {
      setError(`Chyba při přidávání položky. (Možná už existuje?)`);
      console.error(err);
    }
  };

  const loadCurrentState = async () => {
    setLoading(true);
    setError(null);
    try {
        const inventoryData = await getCurrentInventory();

        setInventoryState({
            is_running: inventoryData.is_running,
            entries: inventoryData.entries,
            sessionId: inventoryData.session?.id || null
        });

        if (!inventoryData.is_running) {
            const stockData = await fetchCurrentStock();
            setStockItems(stockData);
        } else {
            setStockItems([]); 
        }

    } catch (err) {
        setError("Chyba při načítání stavu inventury/zásob.");
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleStartInventory = async () => {
    try {
      const data = await startInventory(CLIENT_ID);
        
        setInventoryState({
            is_running: true,
            entries: data.entries, 
            sessionId: data.session.id
        });
        
        setStockItems([]); 

        showSuccessMessage(`Inventura ID ${data.session.id} byla spuštěna!`);
    } catch (err: any) {
        if (err.response && err.response.status === 409) {
             setError("Inventura již probíhá. Načtěte stav stisknutím F5 nebo tlačítkem.");
        } else {
             setError("Chyba při spouštění inventury.");
        }
      console.error(err);
    }
  };

  const handleFinishInventory = async () => {
    if (!inventoryState.sessionId) {
        showSuccessMessage("Nejdříve musíte inventuru spustit.");
        return;
    }
    
    if (window.confirm("Opravdu chcete dokončit inventuru a přepsat stavy zásob?")) {
        try {
            await finishInventory(inventoryState.sessionId);
            showSuccessMessage(`Inventura ID ${inventoryState.sessionId} dokončena. Stavy aktualizovány!`);
            loadCurrentState(); 
        } catch (err) {
            setError("Chyba při dokončování inventury.");
            console.error(err);
        }
    }
  };

  const handleEntryUpdate = useCallback((updatedEntry: InventoryEntry) => {
    setInventoryState(prevState => ({
      ...prevState,
      entries: prevState.entries.map(entry =>
        entry.id === updatedEntry.id ? updatedEntry :entry
      )
    }));
  }, []);

  const showSuccessMessage = useCallback((message: string) => {
    setSuccessMessage(message);
    const timer = setTimeout(() => {
        setSuccessMessage(null);
    }, 3000);

    return () => clearTimeout(timer); 
  }, []);

  const calculateTotalDifferenceValue = (entries: InventoryEntry[]): number => {
    return entries.reduce((total, entry) => total + entry.difference_value, 0);
  };

  useEffect(() => {
    loadCurrentState();
  }, []);

  useEffect(() => {

    socket.on('connect', () => {
      console.log('SocketIO: Připojeno k backendu!');
    });
    
    socket.on('entry_updated', (data: InventoryEntry) => {
      console.log('SocketIO: Aktualizace položky přijata', data);
      handleEntryUpdate(data);
    });

    socket.on('inventory_status_change', () => {
      console.log('SocketIO: Změna stavu inventury, načítám nový stav...');
      loadCurrentState();
    });

    return () => {
      socket.off('connect');
      socket.off('entry_updated');
      socket.off('inventory_status_change');
    }
  }, [loadCurrentState, handleEntryUpdate]);


  if (loading) return <h1>Načítám data...</h1>;
  if (error) return <h1 style={{ color: 'red' }}>Chyba: {error}</h1>;

  // Renderování
  return (
  <div style={{ padding: '20px' }}>
    <h1>INVENTURNÍ SYSTÉM</h1>
    {successMessage && (
        <div style={{ 
            position: 'fixed', 
            top: '20px', 
            right: '20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            padding: '15px 25px', 
            borderRadius: '5px', 
            zIndex: 1000,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }}>
            {successMessage}
        </div>
    )}

    {error && <div style={{ color: 'red', border: '1px solid red', padding: '10px', marginBottom: '10px' }}>{error}</div>}

    {!inventoryState.is_running && (
        <>
            <h2>🟢 Aktuální stav zásob</h2>
            <button onClick={handleStartInventory} style={{ padding: '10px', backgroundColor: 'green', color: 'white', marginBottom: '20px' }}>
                START INVENTURY
            </button>

            <div style={{ padding: '15px', border: '1px solid #666', borderRadius: '5px', marginBottom: '20px' }}>
            <h3>Přidat novou položku do zásob</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label>Název položky:</label>
                    <input 
                        type="text" 
                        value={newItemName} 
                        onChange={(e) => setNewItemName(e.target.value)} 
                        placeholder="Např. Becherovka 0.7l"
                        style={{ padding: '8px' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label>Typ jednotky:</label>
                    <select 
                        value={newItemUnitType} 
                        onChange={(e) => setNewItemUnitType(e.target.value as 'litry' | 'kusy')}
                        style={{ padding: '8px' }}
                    >
                        <option value="litry">Litry</option>
                        <option value="kusy">Kusy</option>
                    </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label>Prodejní cena (Kč):</label>
                    <input 
                        type="number" 
                        value={newItemSellingPrice} 
                        onChange={(e) => setNewItemSellingPrice(parseFloat(e.target.value) || 0.0)} 
                        style={{ padding: '8px', width: '100px', textAlign: 'right' }}
                        step="0.01"
                    />
                </div>
                <button 
                    onClick={handleAddItem} 
                    style={{ backgroundColor: '#28a745', color: 'white', padding: '8px 15px' }}
                >
                    Přidat položku
                </button>
            </div>
        </div>

            <table border={1} cellPadding={10} style={{ width: '100%' }}>
                <thead>
                    <tr>
                        <th>Název položky</th>
                        <th>Jednotka</th>
                        <th>Aktuální stav</th>
                        <th>Cena za jednotku</th>
                        <th>AKCE</th>
                    </tr>
                </thead>
                <tbody>
                {stockItems.map((item) => (
                    // Vykreslení editačního řádku, pokud se ID shoduje
                    item.id === editingItemId && currentEditItem ? (
                        <tr key={item.id} style={{ backgroundColor: '#555' }}>
                            <td>
                                <input 
                                    type="text" 
                                    value={currentEditItem.name} 
                                    onChange={(e) => setCurrentEditItem(prev => ({ ...prev!, name: e.target.value }))}
                                    style={{ width: '100%' }}
                                />
                            </td>
                            <td>
                                <select 
                                    value={currentEditItem.unit_type} 
                                    onChange={(e) => setCurrentEditItem(prev => ({ ...prev!, unit_type: e.target.value as 'litry' | 'kusy' }))}
                                >
                                    <option value="litry">Litry</option>
                                    <option value="kusy">Kusy</option>
                                </select>
                            </td>
                            <td>{item.current_stock.toFixed(2)}</td>
                            <td>
                                <input 
                                    type="number" 
                                    value={currentEditItem.selling_price} 
                                    onChange={(e) => setCurrentEditItem(prev => ({ ...prev!, selling_price: parseFloat(e.target.value) || 0 }))}
                                    style={{ width: '80px', textAlign: 'right' }}
                                    step="0.01"
                                />
                            </td>
                            <td>
                                <button onClick={handleSaveEdit} style={{ backgroundColor: '#28a745', marginRight: '5px' }}>Uložit</button>
                                <button onClick={handleCancelEdit} style={{ backgroundColor: '#6c757d' }}>Zrušit</button>
                            </td>
                        </tr>
                    ) : (
                        // Vykreslení standardního řádku
                        <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.unit_type}</td>
                            <td>{item.current_stock.toFixed(2)}</td>
                            <td>{item.selling_price.toFixed(2)} Kč</td>
                            <td>
                                <button onClick={() => handleStartEdit(item)} style={{ backgroundColor: '#ffc107', marginRight: '5px', padding: '5px 10px', fontSize: '0.9em' }}>
                                    Editovat
                                </button>
                                <button onClick={() => handleDeleteItem(item)} style={{ backgroundColor: '#dc3545', padding: '5px 10px', fontSize: '0.9em' }}>
                                    Smazat
                                </button>
                            </td>
                        </tr>
                    )
                ))}
            </tbody>
            </table>
        </>
    )}
    {inventoryState.is_running && (
        <>
            <h2>🔴 PROBÍHÁ INVENTURA (ID: {inventoryState.sessionId})</h2>
            <button onClick={handleFinishInventory} style={{ padding: '10px', backgroundColor: 'red', color: 'white', marginRight: '10px', marginBottom: '20px' }}>
                DOKONČIT A ULOŽIT STAVY
            </button>

            <div style={{ margin: '15px 0', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#272525ff' }}>
                <p>
                    <span style={{ 
                        marginLeft: '10px', 
                        fontSize: '1.2em', 
                        color: calculateTotalDifferenceValue(inventoryState.entries) === 0 
                            ? 'white' 
                            : calculateTotalDifferenceValue(inventoryState.entries) > 0 
                                ? 'lightgreen' 
                                : 'red' 
                    }}>
                        {calculateTotalDifferenceValue(inventoryState.entries).toFixed(2)} Kč
                    </span>
                </p>
            </div>

            <div style={{ padding: '15px', border: '1px solid #666', borderRadius: '5px', marginBottom: '20px' }}>
            <h3>Přidat novou položku do zásob</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label>Název položky:</label>
                    <input 
                        type="text" 
                        value={newItemName} 
                        onChange={(e) => setNewItemName(e.target.value)} 
                        placeholder="Např. Becherovka 0.7l"
                        style={{ padding: '8px' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label>Typ jednotky:</label>
                    <select 
                        value={newItemUnitType} 
                        onChange={(e) => setNewItemUnitType(e.target.value as 'litry' | 'kusy')}
                        style={{ padding: '8px' }}
                    >
                        <option value="litry">Litry</option>
                        <option value="kusy">Kusy</option>
                    </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label>Prodejní cena (Kč):</label>
                    <input 
                        type="number" 
                        value={newItemSellingPrice} 
                        onChange={(e) => setNewItemSellingPrice(parseFloat(e.target.value) || 0.0)} 
                        style={{ padding: '8px', width: '100px', textAlign: 'right' }}
                        step="0.01"
                    />
                </div>
                <button 
                    onClick={handleAddItem} 
                    style={{ backgroundColor: '#28a745', color: 'white', padding: '8px 15px' }}
                >
                    Přidat položku
                </button>
            </div>
        </div>

            <table border={1} cellPadding={10} style={{ marginTop: '20px', width: '100%' }}>
            <thead>
                <tr>
                    <th>Název položky</th>
                    <th>Původní stav</th>
                    <th>Spočítaný stav</th>
                    <th>Prodalo se</th>
                    <th>Tržba</th>
                </tr>
            </thead>
            <tbody>
                {inventoryState.entries.map((entry) => (
                    <tr key={entry.id}>
                        <td>{entry.item_name} ({entry.unit_type})</td>
                        <td>{entry.original_stock.toFixed(2)}</td>
                        <td>
                            <input 
                                type="number"
                                value={entry.counted_quantity}
                                onChange={(e) => {
                                    const newQuantity = parseFloat(e.target.value);
                                    // 1. Odeslání aktualizace přes Socket.IO na server
                                    updateInventoryEntry(entry.id, newQuantity, CLIENT_ID);
                                    
                                    // 2. Okamžitá lokální aktualizace pro rychlý pocit odezvy
                                    // POZOR: Toto by mělo být nahrazeno daty přicházejícími ze Socketu, 
                                    // ale pro UX a rychlé testování je to v pořádku.
                                    handleEntryUpdate({ ...entry, counted_quantity: newQuantity });
                                }}
                                style={{ 
                                    width: '80px', 
                                    textAlign: 'right', 
                                    padding: '5px',
                                    border: entry.difference_quantity < 0 ? '2px solid orange' : '1px solid #ccc'
                                }}
                            />
                        </td>
                        <td style={{ color: entry.difference_quantity < 0 ? 'red' : 'inherit' }}>
                            {entry.difference_quantity.toFixed(2)}
                        </td>
                        <td style={{ color: entry.difference_value < 0 ? 'red' : 'inherit' }}>
                            {entry.difference_value.toFixed(2)} Kč
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        </>
    )}
  </div>
  );
}

export default App;