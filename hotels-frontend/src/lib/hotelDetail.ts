import useSWR from 'swr';
import axios from './axios';
// Réutilise l'interface Hotel qui doit être exportée depuis hotels.ts
import { Hotel } from './hotels';

// Définition du fetcher
const fetcher = (url: string) => axios.get(url).then(res => res.data);

/**
 * Hook personnalisé pour récupérer les détails d'un hôtel par ID
 */
export const useHotelDetail = (id: string | string[] | undefined) => {
    // L'URL est construite seulement si l'ID est disponible
    const url = id ? `/api/hotels/${id}` : null;

    // Utilise SWR pour la mise en cache et le fetch
    const { data, error, isLoading } = useSWR<Hotel>(url, fetcher);

    return {
        hotel: data,
        isLoading: isLoading,
        error,
    };
};
