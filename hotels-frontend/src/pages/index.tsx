import {
    Box,
    Button,
    Flex,
    Spinner,
    Text as ChakraText,
    HStack,
    Container,
    Input,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Image,
    IconButton,
    InputGroup,
    InputLeftElement,
    Tooltip,
    Heading,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    useToast,
} from '@chakra-ui/react';
import {
    TriangleDownIcon,
    TriangleUpIcon,
    UpDownIcon,
    AddIcon,
    DeleteIcon,
    EditIcon,
    SearchIcon,
    WarningIcon,
} from '@chakra-ui/icons';
import { useAuth } from '../lib/auth';
import { useHotels } from '../lib/hotels';
import { useState } from 'react';
import { Layout } from '../components/Layout';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from '../lib/axios';

// --- (Fonction truncate, Interface PaginationLink, Composant PaginationButton restent inchangés) ---
const truncate = (text: string, length: number) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
};
interface PaginationLink { url: string | null; label: string; active: boolean; }
const PaginationButton = ({ link, onClick }: { link: PaginationLink; onClick: (page: number) => void; }) => {
    const getPageFromUrl = (url: string) => {
        try { const params = new URL(url).searchParams; return parseInt(params.get('page') || '1', 10); }
        catch (e) { const params = new URLSearchParams(url.split('?')[1]); return parseInt(params.get('page') || '1', 10); }
    };
    if (!link.url) { return (<Button size="sm" isDisabled><span dangerouslySetInnerHTML={{ __html: link.label }} /></Button>); }
    return (<Button size="sm" onClick={() => onClick(getPageFromUrl(link.url))} colorScheme={link.active ? 'blue' : 'gray'} variant={link.active ? 'solid' : 'outline'}><span dangerouslySetInnerHTML={{ __html: link.label }} /></Button>);
};

// --- COMPOSANT ThumbnailCell (inchangé) ---
const ThumbnailCell = ({ url, alt }: { url: string | null, alt: string }) => {
    if (url) {
        return (
            <Image
                src={url}
                alt={alt}
                boxSize="40px"
                objectFit="cover"
                borderRadius="md"
            />
        );
    }

    return (
        <Tooltip label="Pas de photo" placement="top">
            <Flex
                boxSize="40px"
                bg="gray.100"
                borderRadius="md"
                align="center"
                justify="center"
                color="gray.500"
                border="1px solid"
                borderColor="gray.300"
            >
                <WarningIcon w={4} h={4} />
            </Flex>
        </Tooltip>
    );
};
// ------------------------------------------------------------------


export default function Home() {
    const { user, isLoading: isAuthLoading } = useAuth({ middleware: 'auth' });
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState('name');
    const [order, setOrder] = useState('asc');

    // Déstructuration pour récupérer 'mutate' (pour le rafraîchissement)
    const { hotels, pagination, isLoading: isHotelsLoading, error, mutate } = useHotels(
        query,
        sort,
        order,
        page
    );

    // ↓↓↓ LOGIQUE DE SUPPRESSION (inchangée) ↓↓↓
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [hotelToDelete, setHotelToDelete] = useState<{id: number, name: string} | null>(null);
    const toast = useToast();

    const openDeleteModal = (hotelId: number, hotelName: string) => {
        setHotelToDelete({ id: hotelId, name: hotelName });
        onOpen();
    };

    const confirmDelete = async () => {
        if (!hotelToDelete) return;

        try {
            await axios.delete(`/api/hotels/${hotelToDelete.id}`);
            mutate();

            toast({
                title: 'Hôtel Supprimé',
                description: `L'hôtel "${hotelToDelete.name}" a été supprimé.`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            onClose();
            setHotelToDelete(null);

        } catch (err) {
            console.error('Erreur de suppression:', err);
            toast({
                title: 'Erreur',
                description: "La suppression a échoué. Le serveur n'a pas pu traiter la requête.",
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            onClose();
        }
    };
    // ↑↑↑ FIN LOGIQUE DE SUPPRESSION ↑↑↑

    const handleSort = (columnName: string) => {
        if (sort === columnName) { setOrder(order === 'asc' ? 'desc' : 'asc'); }
        else { setSort(columnName); setOrder('asc'); }
        setPage(1);
    };
    const renderSortIcon = (columnName: string) => {
        if (sort === columnName) { return order === 'asc' ? <TriangleUpIcon ml={2} /> : <TriangleDownIcon ml={2} />; }
        return <UpDownIcon ml={2} color="gray.400" />;
    };

    // ... (gestion du 'isLoading' inchangée) ...
    if (isAuthLoading || !user) {
        return (
            <Layout>
                <Container centerContent p={10}>
                    <Spinner size="xl" />
                </Container>
            </Layout>
        );
    }

    return (
        <Layout>
            <Container maxW="full" py={5} px={[4, 8]}>
                <Flex mb={4} justifyContent="space-between" alignItems="center">
                    <InputGroup maxW="lg">
                        <InputLeftElement pointerEvents="none">
                            <SearchIcon color="gray.300" />
                        </InputLeftElement>
                        <Input
                            placeholder="Filtrer par nom ou ville..."
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setPage(1);
                            }}
                        />
                    </InputGroup>
                    <Button
                        colorScheme="green"
                        leftIcon={<AddIcon />}
                        onClick={() => router.push('/hotels/create')}
                    >
                        Ajouter un hôtel
                    </Button>
                </Flex>

                <TableContainer borderWidth="1px" borderRadius="md">
                    <Table variant="simple">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th>Photo</Th>
                                <Th cursor="pointer" onClick={() => handleSort('name')}>
                                    <HStack><ChakraText>Nom</ChakraText>{renderSortIcon('name')}</HStack>
                                </Th>
                                <Th>Description</Th>
                                <Th cursor="pointer" onClick={() => handleSort('city')}>
                                    <HStack><ChakraText>Ville</ChakraText>{renderSortIcon('city')}</HStack>
                                </Th>
                                <Th isNumeric>Capacité</Th>
                                <Th isNumeric cursor="pointer" onClick={() => handleSort('price_per_night')}>
                                    <HStack justify="flex-end"><ChakraText>Prix / Nuit</ChakraText>{renderSortIcon('price_per_night')}</HStack>
                                </Th>
                                <Th isNumeric>Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {isHotelsLoading && (
                                <Tr><Td colSpan={7} textAlign="center"><Spinner /></Td></Tr>
                            )}
                            {error && (
                                <Tr><Td colSpan={7} textAlign="center" color="red.500">Erreur de chargement des données.</Td></Tr>
                            )}
                            {hotels && hotels.length === 0 && (
                                <Tr><Td colSpan={7} textAlign="center">Aucun hôtel trouvé.</Td></Tr>
                            )}
                            {hotels && hotels.map((hotel) => (
                                <Tr key={hotel.id}>
                                    <Td>
                                        <ThumbnailCell
                                            url={hotel.thumbnail_url}
                                            alt={hotel.name}
                                        />
                                    </Td>
                                    <Td fontWeight="bold">
                                        <Button
                                            variant="link"
                                            colorScheme="blue"
                                            fontWeight="bold"
                                            onClick={() => router.push(`/hotels/${hotel.id}`)}
                                        >
                                            {hotel.name}
                                        </Button>
                                    </Td>
                                    <Td>
                                        <ChakraText title={hotel.description}>
                                            {truncate(hotel.description, 60)}
                                        </ChakraText>
                                    </Td>
                                    <Td>{hotel.city}</Td>
                                    <Td isNumeric>{hotel.max_capacity}</Td>
                                    {/* CORRECTION: Retrait de l'accolade superflue dans le JSX */}
                                    <Td isNumeric>{hotel.price_per_night} €</Td>
                                    <Td isNumeric>
                                        <IconButton
                                            aria-label="Modifier l'hôtel"
                                            icon={<EditIcon />}
                                            colorScheme="blue" // Utilisation de blue
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/hotels/${hotel.id}/edit`)} // <-- Action pour l'édition
                                        />
                                        <IconButton
                                            aria-label="Supprimer l'hôtel"
                                            icon={<DeleteIcon />}
                                            colorScheme="red"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openDeleteModal(hotel.id, hotel.name)}
                                        />
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>

                <HStack mt={4} justify="center" spacing={2} wrap="wrap">
                    {pagination && pagination.links.map((link: PaginationLink, index: number) => (
                        <PaginationButton
                            key={index}
                            link={link}
                            onClick={(page) => setPage(page)}
                        />
                    ))}
                </HStack>
            </Container>

            {/* MODAL DE CONFIRMATION DE SUPPRESSION (inchangé) */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Confirmer la suppression</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <ChakraText>
                            Êtes-vous sûr de vouloir supprimer l'hôtel
                            <ChakraText as="span" fontWeight="bold"> "{hotelToDelete?.name}"</ChakraText>?
                            Cette action est irréversible et supprimera toutes les photos associées.
                        </ChakraText>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" onClick={onClose} mr={3}>
                            Annuler
                        </Button>
                        <Button colorScheme="red" onClick={confirmDelete} leftIcon={<DeleteIcon />}>
                            Supprimer
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Layout>
    );
}
