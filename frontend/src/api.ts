import axios from 'axios';
import { io } from 'socket.io-client';

const api = axios.create({
  baseURL: '/api', 
});

export const socket = io();

export interface Item {
  id: number;
  name: string;
  unit_type: 'liters' | 'pieces';
  current_stock: number;
  selling_price: number;
}

//Interface pro zápis
export interface InventoryEntry {
    id: number;
    item_id: number;
    session_id: number;
    counted_quantity: number;
    original_stock: number;
    last_updated_at: string; // ISO formát
    last_updated_by_client_id: string;
    item_name: string;
    unit_type: 'liters' | 'pieces';
    selling_price: number;
    difference_quantity: number;
    difference_value: number;
}

//Stav zásob atkuální
export const fetchCurrentStock = async (): Promise<Item[]> => {
    const response = await api.get('/stock');
    return response.data.stock; 
};

// -------------------
//  INVENTURNI FUNKCE
// -------------------
//Načtení položek
export const fetchItems = async (): Promise<Item[]> => {
  const response = await api.get('/items');
  return response.data;
};

//Start inventury
export const startInventory = async (clientId: string) => {
    const response = await api.post('/inventory/start', { client_id: clientId });
    return response.data;
};

//Konec inventury
export const finishInventory = async (sessionId: number) => {
    await api.post(`/inventory/finish/${sessionId}`);
};

//Current invetura
export const getCurrentInventory = async (): Promise<{ is_running: boolean, session: any | null, entries: InventoryEntry[] }> => {
    const response = await api.get('/inventory/current');
    return response.data;
};

// --------------------------------------------
// Funkce pro aktualizaci stavu v reálném čase 
// --------------------------------------------

export const updateInventoryEntry = (
    entryId: number,
    quantity: number,
    clientId: string
) => {
    socket.emit('entry_updated', {
        entry_id: entryId,
        counted_quantity: quantity,
        client_id: clientId,
    });
};