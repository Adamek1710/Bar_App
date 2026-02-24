import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const api = axios.create({
  baseURL: '/api', 
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, remove it and redirect to login
      localStorage.removeItem('auth_token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Create socket with authentication
export const createSocket = (token?: string): Socket => {
  const socketOptions: any = {};
  
  if (token) {
    socketOptions.auth = {
      token: token
    };
    socketOptions.query = {
      token: token
    };
  }
  
  return io(socketOptions);
};

// Default socket (will be updated after login)
export let socket = createSocket();

export function updateSocketToken(token: string) {
  socket = createSocket(token);
}

export interface Item {
  id: number;
  name: string;
  unit_type: 'litry' | 'kusy';
  current_stock: number;
  selling_price: number;

  full_bottle_weight?: number;
  empty_bottle_weight?: number;
  shot_weight?: number;
  shot_volume?: number;
  current_weight?: number;
}

//Interface pro zápis
export interface InventoryEntry {
    id: number;
    item_id: number;
    session_id: number;
    counted_quantity: number;
    original_stock: number;

    counted_weight: number | null;
    original_weight: number | null;

    last_updated_at: string; // ISO formát
    last_updated_by_client_id: string;
    item_name: string;
    unit_type: 'litry' | 'kusy';
    selling_price: number;
    difference_quantity: number;
    difference_value: number;
}

//IMPORT
export const bulkImportItems = async (items: any[]) => {
    const promises = items.map(item => api.post('/items', item));
    return Promise.all(promises);
};

// ------------------
//    MENU FUNKCE
// ------------------

export const fetchPublicMenu = async () => {
    const response = await axios.get('/api/public-menu');
    return response.data;
};

export const addPublicMenuItem = async (item: any) => {
    const response = await axios.post('/api/public-menu', item);
    return response.data;
};

export const deletePublicMenuItem = async (id: number) => {
    await axios.delete(`/api/public-menu/${id}`);
};

// ------------------
//     API FUNKCE
// ------------------

export const addItem = async (
    name: string,
    unitType: 'litry' | 'kusy',
    sellingPrice: number,
    extraData?: Partial<Item>
): Promise<Item> => {
    const response = await api.post('/items', {
        name: name,
        unit_type: unitType,
        selling_price: sellingPrice,
        ...extraData
    });
    return response.data;
}

export const updateItem = async (
    id: number,
    name: string,
    unitType: 'litry' | 'kusy',
    sellingPrice: number,
    currentStock: number,
    extraData?: Partial<Item>
): Promise<Item> => {
    const response = await api.put(`/items/${id}`, {
        name: name,
        unit_type: unitType,
        selling_price: sellingPrice,
        current_stock: currentStock,
        ...extraData
    });
    return response.data;
};

export const deleteItem = async (id: number): Promise<void> => {
    await api.delete(`/items/${id}`);
};

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
    quantity: number | null,
    weight: number | null,
    clientId: string
) => {
    socket.emit('entry_updated', {
        entry_id: entryId,
        counted_quantity: quantity,
        counted_weight: weight,
        client_id: clientId
    });
};