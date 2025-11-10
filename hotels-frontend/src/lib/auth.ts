import useSWR from 'swr';
import axios from './axios'; // Notre instance axios
import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Définissez le type de l'utilisateur (simplifié)
interface User {
    name: string;
    email: string;
}

export const useAuth = ({ middleware, redirectIfAuthenticated } = {}) => {
    const router = useRouter();

    // Le fetcher: une fonction qui utilise axios pour récupérer les données
    const fetcher = (url: string) =>
        axios.get(url).then(res => res.data).catch(error => {
            if (error.response.status === 401) return null; // Non authentifié
            throw error;
        });

    // Utiliser SWR pour "surveiller" /api/user
    const { data: user, error, isLoading, mutate } = useSWR<User | null>('/api/user', fetcher);

    // ↓↓↓ --- AJOUTEZ CETTE FONCTION --- ↓↓↓
    const logout = async () => {
        if (!user) return; // Déjà déconnecté

        try {
            await axios.post('/logout');
            // Dit à SWR que l'utilisateur est maintenant 'null'
            mutate(null);
        } catch (error) {
            console.error('Erreur lors de la déconnexion', error);
        }

        // Redirige vers le login APRÈS la déconnexion
        router.push('/login');
    };
    // ↑↑↑ ------------------------------ ↑↑↑


    useEffect(() => {
        // Si on est 'guest' (login) et qu'on est authentifié, on redirige
        if (middleware === 'guest' && redirectIfAuthenticated && user) {
            router.push(redirectIfAuthenticated);
        }
        // Si on est 'auth' (protégé) et qu'on n'est PAS authentifié
        if (middleware === 'auth' && !isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, middleware, redirectIfAuthenticated, router]);

    return {
        user,
        isLoading,
        mutate,
        logout, // <-- Assurez-vous de retourner la fonction
    };
};
