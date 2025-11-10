import useSWR from 'swr';
import axios from './axios'; // Notre instance axios configurée

// --- Définition des Types (basé sur vos migrations) ---
interface HotelPicture {
    id: number;
    filepath: string;
}

export interface Hotel {
    id: number;
    name: string;
    description: string;
    max_capacity: number;
    city: string;
    price_per_night: number;
    // pictures est maintenant inclus grâce à notre correction du Repository
    pictures: HotelPicture[];
}

// L'API Laravel renvoie une structure de pagination
interface PaginatedHotels {
    data: Hotel[];
    links: { [key: string]: string | null };
    meta: {
        current_page: number;
        last_page: number;
        total: number;
    };
}
// ---------------------------------------------------

// Le 'fetcher' que SWR utilisera
const fetcher = (url: string) => axios.get(url).then(res => res.data);

/**
 * Hook personnalisé pour récupérer les hôtels
 */
export const useHotels = (
    query: string,
    sort: string,
    order: string,
    page: number
) => {

    // Construit l'URL avec les paramètres de filtre/tri
    const params = new URLSearchParams({
        q: query,
        sort: sort,
        order: order,
        page: page.toString(),
    });

    const url = `/api/hotels?${params.toString()}`;

    // Utilise SWR pour la récupération de données et le cache
    const { data, error, isLoading, mutate } = useSWR<PaginatedHotels>(url, fetcher, {
        // Garde les données précédentes affichées pendant le chargement de nouvelles
        keepPreviousData: true,
    });

    return {
        hotels: data?.data, // Le tableau des hôtels
        pagination: data,     // L'objet de pagination complet
        isLoading,
        error,
        mutate,
    };
};
