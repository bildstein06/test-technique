import {
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    Avatar,
    Text as ChakraText, // Renommé ici
    Spinner,
} from '@chakra-ui/react';
import { useAuth } from '../lib/auth';
import React from 'react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    // Ce layout appelle useAuth SANS middleware.
    // Il a juste besoin des infos de l'utilisateur pour le header.
    const { user, logout, isLoading } = useAuth({});

    return (
        <Box>
            {/* --- Header Fixe (Code que nous avons extrait) --- */}
            <Flex
                as="header"
                width="full"
                align="center"
                justifyContent={['center', 'space-between']}
                wrap="wrap"
                p={4}
                borderBottom="1px"
                borderColor="gray.200"
                gap={4}
                position="sticky"
                top="0"
                zIndex="sticky"
                bg="white"
                boxShadow="sm"
            >
                <Heading size="md">Test Technique Hôtels</Heading>
                <HStack spacing={4}>
                    {/* Gère l'état de chargement de l'utilisateur */}
                    {isLoading ? (
                        <Spinner size="sm" />
                    ) : user ? (
                        <>
                            <Avatar size="sm" />
                            {/* Utilisé ici */}
                            <ChakraText fontWeight="bold" d={['none', 'inline']}>
                                {user.name}
                            </ChakraText>
                            <Button colorScheme="blue" size="sm" onClick={logout}>
                                Déconnexion
                            </Button>
                        </>
                    ) : (
                        // Fallback si l'utilisateur n'est pas chargé (ex: page login)
                        <Button as="a" href="/login" colorScheme="blue" size="sm">
                            Connexion
                        </Button>
                    )}
                </HStack>
            </Flex>

            {/* --- Contenu de la page --- */}
            <Box as="main">
                {children}
            </Box>
        </Box>
    );
};
