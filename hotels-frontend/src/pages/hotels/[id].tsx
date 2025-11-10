import {
    Box,
    Button,
    Container,
    Heading,
    Stack,
    Text as ChakraText,
    Link as ChakraLink,
    Spinner,
    Grid,
    GridItem,
    Image,
    SimpleGrid,
    List,
    ListItem,
    HStack,
    Divider,
    // ↓↓↓ AJOUT DES IMPORTS POUR MODAL/ACTIONS ↓↓↓
    IconButton,
    useDisclosure,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
} from '@chakra-ui/react';
import { ArrowBackIcon, AtSignIcon, SmallAddIcon, MinusIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons'; // EditIcon et DeleteIcon sont utilisés
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Layout } from '../../components/Layout';
import { useHotelDetail } from '../../lib/hotelDetail';
import { useAuth } from '../../lib/auth';
import { useState } from 'react'; // Ajouté pour useDisclosure, bien que non nécessaire, c'est mieux d'importer
import axios from '../../lib/axios'; // Pour l'appel DELETE

// Composant utilitaire pour les lignes de détails
const DetailItem = ({ label, value }: { label: string, value: any }) => (
    <Box>
        <ChakraText fontWeight="bold" fontSize="sm" color="gray.600">{label}</ChakraText>
        <ChakraText fontSize="md">{value}</ChakraText>
    </Box>
);

export default function HotelDetail() {
    const router = useRouter();
    const { id } = router.query;
    const hotelId = typeof id === 'string' ? id : undefined;

    const { hotel, isLoading, error } = useHotelDetail(id);
    const { isLoading: isAuthLoading } = useAuth({ middleware: 'auth' });

    // ↓↓↓ LOGIQUE DE SUPPRESSION DANS LA PAGE DE DÉTAIL ↓↓↓
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    // Fonction de suppression finale et redirection
    const confirmDelete = async () => {
        if (!hotel) return;

        try {
            await axios.delete(`/api/hotels/${hotel.id}`);

            toast({
                title: 'Hôtel Supprimé',
                description: `L'hôtel "${hotel.name}" a été supprimé.`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onClose();
            router.push('/'); // Redirige vers la liste après la suppression

        } catch (err) {
            console.error('Erreur de suppression:', err);
            toast({
                title: 'Erreur',
                description: "La suppression de l'hôtel a échoué. Le serveur n'a pu traiter la requête.",
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            onClose();
        }
    };
    // ↑↑↑ FIN LOGIQUE DE SUPPRESSION ↑↑↑


    // Handle Loading/Error/Not Found States
    if (isAuthLoading || isLoading || !hotel) {
        if (error && error.response?.status === 404) {
            return (
                <Layout>
                    <Container centerContent p={10}>
                        <Heading size="lg" color="red.500">Hôtel non trouvé</Heading>
                    </Container>
                </Layout>
            );
        }
        return (
            <Layout>
                <Container centerContent p={10}>
                    <Spinner size="xl" />
                </Container>
            </Layout>
        );
    }

    // Formattage des données
    const fullAddress = `${hotel.address1}, ${hotel.address2 ? hotel.address2 + ', ' : ''}${hotel.zipcode} ${hotel.city}, ${hotel.country}`;

    return (
        <Layout>
            <Container maxW="container.xl" py={5}>

                {/* Lien Retour */}
                <Link href="/" passHref>
                    <ChakraLink d="inline-flex" alignItems="center" mb={6} color="blue.500">
                        <ArrowBackIcon mr={2} />
                        Retour à la liste des hôtels
                    </ChakraLink>
                </Link>

                {/* Section Titre et Boutons d'Action */}
                <HStack justify="space-between" align="center" mb={8}>
                    <Heading size="xl">{hotel.name}</Heading>
                    <HStack spacing={2}>
                        {/* BOUTON MODIFIER */}
                        <Button
                            colorScheme="blue"
                            leftIcon={<EditIcon />}
                            onClick={() => router.push(`/hotels/${hotelId}/edit`)} // Navigue vers la page d'édition
                        >
                            Modifier
                        </Button>
                        {/* BOUTON SUPPRIMER */}
                        <Button
                            colorScheme="red"
                            leftIcon={<DeleteIcon />}
                            onClick={onOpen} // Ouvre le modal de confirmation
                        >
                            Supprimer
                        </Button>
                    </HStack>
                </HStack>

                {/* Grille Principale (Photos 2/3 | Détails 1/3) */}
                <Grid templateColumns={['1fr', '1fr', '2fr 1fr']} gap={8}>

                    {/* 1. Zone Galerie de Photos et Description */}
                    <GridItem>
                        <Heading size="md" mb={4}>Galerie de photos</Heading>

                        {hotel.pictures && hotel.pictures.length > 0 ? (
                            <SimpleGrid columns={[2, 3, 4]} spacing={4}>
                                {hotel.pictures.map((picture) => (
                                    <Box key={picture.id} borderRadius="md" overflow="hidden" boxShadow="md" cursor="pointer">
                                        <Image
                                            src={`http://localhost:8000/storage/${picture.filepath}`}
                                            alt={`Photo ${picture.position}`}
                                            objectFit="cover"
                                            width="100%"
                                            height="150px"
                                        />
                                    </Box>
                                ))}
                            </SimpleGrid>
                        ) : (
                            <ChakraText color="gray.500">Aucune photo disponible pour cet hébergement.</ChakraText>
                        )}

                        <Divider my={8} />

                        {/* Description Détaillée */}
                        <Heading size="md" mb={4}>Description</Heading>
                        <ChakraText whiteSpace="pre-wrap" fontSize="md">{hotel.description}</ChakraText>

                    </GridItem>

                    {/* 2. Zone Caractéristiques et Informations */}
                    <GridItem bg="gray.50" p={6} borderRadius="lg" h="fit-content">
                        <Heading size="md" mb={6}>Caractéristiques</Heading>

                        <Stack spacing={4}>
                            <DetailItem
                                label="Prix à la nuit"
                                value={`${hotel.price_per_night} €`}
                            />
                            <DetailItem
                                label="Capacité maximale"
                                value={`${hotel.max_capacity} personnes`}
                            />

                            <Divider />

                            <DetailItem
                                label="Adresse complète"
                                value={fullAddress}
                            />
                            <DetailItem
                                label="Coordonnées GPS"
                                value={`Lat: ${hotel.lat}, Lng: ${hotel.lng}`}
                            />

                            {/* Quick Access List */}
                            <Divider />
                            <Heading size="sm" mb={2}>Statuts</Heading>
                            <List spacing={2}>
                                <ListItem>
                                    <HStack>
                                        <SmallAddIcon boxSize={5} color="green.500"/>
                                        <ChakraText>Créé le: {new Date(hotel.created_at).toLocaleDateString()}</ChakraText>
                                    </HStack>
                                </ListItem>
                                <ListItem>
                                    <HStack>
                                        <MinusIcon boxSize={5} color="orange.500"/>
                                        <ChakraText>Mis à jour le: {new Date(hotel.updated_at).toLocaleDateString()}</ChakraText>
                                    </HStack>
                                </ListItem>
                            </List>
                        </Stack>
                    </GridItem>
                </Grid>
            </Container>

            {/* Modal de confirmation de suppression */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Confirmer la suppression</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <ChakraText>
                            Êtes-vous sûr de vouloir supprimer l'hôtel
                            <ChakraText as="span" fontWeight="bold"> "{hotel.name}"</ChakraText>?
                            Cette action est irréversible et supprimera toutes les données associées.
                        </ChakraText>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" onClick={onClose} mr={3}>
                            Annuler
                        </Button>
                        <Button colorScheme="red" onClick={confirmDelete} leftIcon={<DeleteIcon />}>
                            Supprimer définitivement
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Layout>
    );
}
