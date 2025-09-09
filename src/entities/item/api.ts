import axios from 'axios';
import { type ItemsResponse, type StateResponse, type SaveOrderRequest, type SaveSelectedRequest } from '@/shared/types/item';

const API_URL = import.meta.env.VITE_API_URL;

console.log('API Version Check - Deploy Time: 2025-09-09 ' + new Date().toISOString());

//build
export const itemsApi = {
    // Получение списка элементов с пагинацией и поиском
    getItems: async (options: { page: number, limit?: number, term?: string }) => {
        const response = await axios.get<ItemsResponse>(`${API_URL}/items`, {
            params: {
                page: options.page,
                limit: options.limit || 20,
                search: options.term || ''
            }
        });
        return {
            data: response.data,
            status: response.status
        };
    },

    // Сохранение порядка сортировки
    saveOrder: async (order: number[]) => {
        const response = await axios.post<StateResponse>(`${API_URL}/items/order`, {
            order
        } as SaveOrderRequest);
        return {
            data: response.data,
            status: response.status
        };
    },

    // Сохранение выбранных элементов
    saveSelected: async (selected: number[]) => {
        console.log('Sending saveSelected request to:', `${API_URL}/items/selected`);
        console.log('With data:', { selected });
        const response = await axios.post<StateResponse>(`${API_URL}/items/selected`, {
            selected
        } as SaveSelectedRequest);
        console.log('SaveSelected response:', response.data);
        return {
            data: response.data,
            status: response.status
        };
    },

    // Получение текущего состояния
    getState: async () => {
        const response = await axios.get<StateResponse>(`${API_URL}/items/state`);
        return {
            data: response.data,
            status: response.status
        };
    }
};
