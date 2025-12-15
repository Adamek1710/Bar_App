import React, { useState, useEffect, useCallback } from 'react';
import { getCurrentInventory, startInventory, finishInventory, socket, updateInventoryEntry, fetchCurrentStock} from './api';
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

        alert(`Inventura ID ${data.session.id} byla spuštěna!`);
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
        alert("Nejdříve musíte inventuru spustit.");
        return;
    }
    
    if (window.confirm("Opravdu chcete dokončit inventuru a přepsat stavy zásob?")) {
        try {
            await finishInventory(inventoryState.sessionId);
            alert(`Inventura ID ${inventoryState.sessionId} dokončena. Stavy aktualizovány!`);
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

    {!inventoryState.is_running && (
        <>
            <h2>🟢 Aktuální stav zásob</h2>
            <button onClick={handleStartInventory} style={{ padding: '10px', backgroundColor: 'green', color: 'white', marginBottom: '20px' }}>
                START INVENTURY
            </button>

            <table border={1} cellPadding={10} style={{ width: '100%' }}>
                <thead>
                    <tr>
                        <th>Název položky</th>
                        <th>Aktuální stav</th>
                        <th>Jednotka</th>
                        <th>Cena za jednotku</th>
                    </tr>
                </thead>
                <tbody>
                    {stockItems.map((item) => (
                        <tr key={item.id}>
                            <td>{item.name}</td>
                            <td><b>{item.current_stock.toFixed(2)}</b></td>
                            <td>{item.unit_type}</td>
                            <td>{item.selling_price.toFixed(2)} Kč</td>
                        </tr>
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