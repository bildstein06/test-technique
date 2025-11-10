import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Heading,
    Stack,
    Alert,
    AlertIcon,
    Container,
    Spinner,
    Text,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import axios from '../lib/axios';
import { useAuth } from '../lib/auth'; // Importez le hook

// Type pour les données du formulaire
type FormData = {
    email: string;
    password: string;
};

export default function Login() {
    // Appelez le hook avec la règle "guest"
    // Redirige vers la racine "/" si l'utilisateur est déjà connecté
    const { user, mutate, isLoading: isAuthLoading } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/',
    });

    const { register, handleSubmit } = useForm<FormData>();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Récupérer le cookie CSRF
            await axios.get('/sanctum/csrf-cookie');

            // 2. Tenter la connexion
            await axios.post('/login', data);

            // 3. Rafraîchir l'état d'authentification (SWR)
            // Le hook s'occupera de la redirection
            await mutate();

        } catch (err: any) {
            setIsLoading(false);
            if (err.response && err.response.status === 422) {
                setError(err.response.data.message || "L'email ou le mot de passe est incorrect.");
            } else {
                setError('Une erreur est survenue. Le serveur est-il en ligne ?');
            }
        }
    };

    // Pendant que le hook vérifie si on est déjà loggé, on affiche un loader
    if (isAuthLoading || user) {
        return (
            <Container centerContent p={10}>
                <Spinner size="xl" />
                <Text mt={4}>Vérification...</Text>
            </Container>
        );
    }

    // Si on n'est pas loggé, on affiche le formulaire
    return (
        <Container centerContent>
            {/* Box responsive */}
            <Box
                w={['full', 'md']} // Pleine largeur sur mobile, 'md' sur desktop
                p={[4, 8]} // Moins de padding sur mobile
                mt={[10, '10vh']} // Marge en haut
                mx="auto"
                border={['none', '1px']} // Pas de bordure sur mobile
                borderColor={['', 'gray.200']}
                borderRadius={10}
            >
                <Stack as="form" spacing={4} onSubmit={handleSubmit(onSubmit)}>
                    <Heading as="h1" size="lg" textAlign="center">
                        Connexion
                    </Heading>

                    {/* Affichage des erreurs de connexion */}
                    {error && (
                        <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            {error}
                        </Alert>
                    )}

                    <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                            type="email"
                            placeholder="test@example.com"
                            {...register('email', { required: true })}
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel>Mot de passe</FormLabel>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            {...register('password', { required: true })}
                        />
                    </FormControl>

                    <Button
                        type="submit"
                        colorScheme="blue"
                        size="lg"
                        fontSize="md"
                        isLoading={isLoading} // Affiche un spinner sur le bouton
                    >
                        Se connecter
                    </Button>
                </Stack>
            </Box>
        </Container>
    );
}
