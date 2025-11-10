import {
    Box, Button, Container, FormControl, FormLabel, Heading, Input, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Stack, Textarea, FormErrorMessage, useToast, Grid, GridItem, Image, CloseButton, Spinner, Text as ChakraText, Link as ChakraLink, HStack, IconButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, SimpleGrid,
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth';
import { Layout } from '../../../components/Layout';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/router';
import axios from '../../../lib/axios';
import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useHotelDetail } from '../../../lib/hotelDetail';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'; // D&D

// --- Définition du Schéma de Validation (Identique à create.tsx) ---
const schema = yup.object().shape({
    name: yup.string().required("Le nom est requis").max(255),
    address1: yup.string().required("L'adresse est requise"),
    address2: yup.string().nullable(),
    zipcode: yup.string().required("Le code postal est requis"),
    city: yup.string().required("La ville est requise"),
    country: yup.string().required("Le pays est requis"),
    lat: yup.number().typeError('Doit être un nombre valide').min(-90, "Latitude invalide (Min: -90)").max(90, "Latitude invalide (Max: 90)").required("La latitude est requise"),
    lng: yup.number().typeError('Doit être un nombre valide').min(-180, "Longitude invalide (Min: -180)").max(180, "Longitude invalide (Max: 180)").required("La longitude est requise"),
    description: yup.string().nullable().max(5000, "La description est trop longue (max 5000)"),
    max_capacity: yup.number().typeError('Doit être un nombre entier').integer().min(1, "Min. 1 personne").max(200, "Max. 200 personnes").required("La capacité est requise"),
    price_per_night: yup.number().typeError('Doit être un nombre').min(0, "Le prix ne peut être négatif").required("Le prix est requis"),
});
type FormData = yup.InferType<typeof schema>;

// Interfaces pour les photos (inchangées)
interface ExistingPicture {
    id: number;
    filepath: string;
    position: number;
    preview: string;
}
interface NewFile extends File {
    preview: string;
}

// Fonction utilitaire pour réordonner une liste lors du D&D (inchangée)
const reorderList = (list: any[], startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};


export default function EditHotel() {
    const router = useRouter();
    const { id } = router.query;
    const hotelId = typeof id === 'string' ? id : undefined;

    const { hotel, isLoading: isHotelLoading } = useHotelDetail(hotelId);

    const [existingPictures, setExistingPictures] = useState<ExistingPicture[]>([]);
    const [newFiles, setNewFiles] = useState<NewFile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const [pictureToDelete, setPictureToDelete] = useState<number | null>(null);

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
        resolver: yupResolver(schema),
    });

    // 1. Initialisation du formulaire avec les données de l'API
    useEffect(() => {
        if (hotel) {
            reset({
                name: hotel.name,
                address1: hotel.address1,
                address2: hotel.address2,
                zipcode: hotel.zipcode,
                city: hotel.city,
                country: hotel.country,
                lat: hotel.lat,
                lng: hotel.lng,
                description: hotel.description,
                max_capacity: hotel.max_capacity,
                price_per_night: hotel.price_per_night,
            });

            if (hotel.pictures) {
                setExistingPictures(
                    hotel.pictures
                        .map((p: any) => ({
                            id: p.id,
                            filepath: p.filepath,
                            position: p.position,
                            preview: `http://localhost:8000/storage/${p.filepath}`,
                        }))
                        .sort((a, b) => a.position - b.position)
                );
            }
        }
    }, [hotel, reset]);

    // --- Logique de Drag & Drop ---
    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        if (result.source.droppableId === 'existing-photos' && result.destination.droppableId === 'existing-photos') {
            const newOrder = reorderList(
                existingPictures,
                result.source.index,
                result.destination.index
            );
            setExistingPictures(newOrder);
        }
    };

    // --- Upload de Nouvelles Photos ---
    const { getRootProps, getInputProps } = useDropzone({
        accept: { 'image/*': ['.jpeg', '.png', '.webp'] },
        onDrop: (acceptedFiles) => {
            setNewFiles((prevFiles) => [
                ...prevFiles,
                ...acceptedFiles.map((file) => Object.assign(file, {
                    preview: URL.createObjectURL(file),
                }) as NewFile),
            ]);
        },
    });

    // --- Suppression et Réordonnancement ---

    const handleDeleteOpen = (pictureId: number) => {
        setPictureToDelete(pictureId);
        onDeleteOpen();
    };

    const handleDeleteConfirm = async () => {
        if (!hotelId || !pictureToDelete) return;

        try {
            await axios.delete(`/api/hotels/${hotelId}/pictures/${pictureToDelete}`);
            setExistingPictures(prev => prev.filter(p => p.id !== pictureToDelete));
            toast({ title: 'Photo supprimée', status: 'warning' });
        } catch (error) {
            toast({ title: "Erreur de suppression", status: 'error' });
        } finally {
            setPictureToDelete(null);
            onDeleteClose();
        }
    };

    // Rendu des photos (inchangé)
    const renderPhotos = () => (
        <Droppable droppableId="existing-photos" direction="horizontal">
            {(provided) => (
                <Grid
                    templateColumns="repeat(auto-fill, minmax(100px, 1fr))"
                    gap={4}
                    mt={0}
                    w="full"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                >
                    {[...existingPictures, ...newFiles].map((file, index) => {
                        const uniqueDndId = file.id ? `exist-${file.id}` : `new-${file.name}`;

                        return (
                            <Draggable key={uniqueDndId} draggableId={uniqueDndId} index={index}>
                                {(provided, snapshot) => (
                                    <GridItem
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        opacity={snapshot.isDragging ? 0.8 : 1}
                                    >
                                        <Box boxSize="100px" position="relative">
                                            <Image
                                                src={file.preview || `http://localhost/storage/${file.filepath}`}
                                                boxSize="100px"
                                                objectFit="cover"
                                                borderRadius="md"
                                            />

                                            {/* Actions : Uniquement si la photo est existante */}
                                            {file.id !== 0 && (
                                                <HStack position="absolute" top={1} right={1} spacing={1}>
                                                    <CloseButton
                                                        size="sm"
                                                        onClick={() => handleDeleteOpen(file.id)}
                                                        bg="whiteAlpha.700"
                                                    />
                                                </HStack>
                                            )}
                                        </Box>
                                    </GridItem>
                                )}
                            </Draggable>
                        );
                    })}
                    {provided.placeholder}
                </Grid>
            )}
        </Droppable>
    );

    // --- Logique de soumission (inchangée) ---
    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setIsSubmitting(true);

        try {
            await axios.put(`/api/hotels/${hotelId}`, data);

            const orderedIds = existingPictures.map(p => p.id);
            await axios.patch(`/api/hotels/${hotelId}/pictures/reorder`, { picture_ids: orderedIds });

            if (newFiles.length > 0) {
                for (const file of newFiles) {
                    const formData = new FormData();
                    formData.append('picture', file);
                    await axios.post(`/api/hotels/${hotelId}/pictures`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                }
            }

            toast({ title: 'Hôtel mis à jour', status: 'success' });
            router.push(`/hotels/${hotelId}`);

        } catch (error) {
            toast({ title: 'Erreur de mise à jour', status: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isHotelLoading || !hotel) {
        return <Layout><Container centerContent p={10}><Spinner size="xl" /></Container></Layout>;
    }

    return (
        <Layout>
            <Container maxW="container.lg" py={5}>
                {/* Lien Retour */}
                <Link href={`/hotels/${hotelId}`} passHref>
                    <ChakraLink d="inline-flex" alignItems="center" mb={6} color="blue.500">
                        <ArrowBackIcon mr={2} />
                        Retour au détail de {hotel.name}
                    </ChakraLink>
                </Link>

                <Heading mb={6}>Modification : {hotel.name}</Heading>

                <Stack as="form" spacing={4} onSubmit={handleSubmit(onSubmit)}>
                    {/* --- Champs de texte (Identique à create.tsx) --- */}
                    <FormControl isInvalid={!!errors.name}>
                        <FormLabel>Nom</FormLabel>
                        <Input {...register('name')} />
                        <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                    </FormControl>
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <GridItem colSpan={[2, 1]}>
                            <FormControl isInvalid={!!errors.address1}>
                                <FormLabel>Adresse 1</FormLabel>
                                <Input {...register('address1')} />
                                <FormErrorMessage>{errors.address1?.message}</FormErrorMessage>
                            </FormControl>
                        </GridItem>
                        <GridItem colSpan={[2, 1]}>
                            <FormControl isInvalid={!!errors.address2}>
                                <FormLabel>Adresse 2 (optionnel)</FormLabel>
                                <Input {...register('address2')} />
                                <FormErrorMessage>{errors.address2?.message}</FormErrorMessage>
                            </FormControl>
                        </GridItem>
                        <GridItem colSpan={1}>
                            <FormControl isInvalid={!!errors.zipcode}>
                                <FormLabel>Code Postal</FormLabel>
                                <Input {...register('zipcode')} />
                                <FormErrorMessage>{errors.zipcode?.message}</FormErrorMessage>
                            </FormControl>
                        </GridItem>
                        <GridItem colSpan={1}>
                            <FormControl isInvalid={!!errors.city}>
                                <FormLabel>Ville</FormLabel>
                                <Input {...register('city')} />
                                <FormErrorMessage>{errors.city?.message}</FormErrorMessage>
                            </FormControl>
                        </GridItem>
                        <GridItem colSpan={2}>
                            <FormControl isInvalid={!!errors.country}>
                                <FormLabel>Pays</FormLabel>
                                <Input {...register('country')} />
                                <FormErrorMessage>{errors.country?.message}</FormErrorMessage>
                            </FormControl>
                        </GridItem>
                    </Grid>
                    <FormControl isInvalid={!!errors.description}>
                        <FormLabel>Description</FormLabel>
                        <Textarea {...register('description')} />
                        <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
                    </FormControl>

                    {/* --- Champs numériques (Capacité, Prix, Lat/Lng) --- */}
                    <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                        <GridItem colSpan={[2, 1]}>
                            <FormControl isInvalid={!!errors.max_capacity}>
                                <FormLabel>Capacité Max</FormLabel>
                                <Controller
                                    name="max_capacity"
                                    control={control}
                                    render={({ field }) => (
                                        <NumberInput {...field} min={1} max={200}>
                                            <NumberInputField />
                                            <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                                        </NumberInput>
                                    )}
                                />
                                <FormErrorMessage>{errors.max_capacity?.message}</FormErrorMessage>
                            </FormControl>
                        </GridItem>
                        <GridItem colSpan={[2, 1]}>
                            <FormControl isInvalid={!!errors.price_per_night}>
                                <FormLabel>Prix / Nuit (€)</FormLabel>
                                <Controller
                                    name="price_per_night"
                                    control={control}
                                    render={({ field }) => (
                                        <NumberInput {...field} min={0} precision={2}>
                                            <NumberInputField />
                                            <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                                        </NumberInput>
                                    )}
                                />
                                <FormErrorMessage>{errors.price_per_night?.message}</FormErrorMessage>
                            </FormControl>
                        </GridItem>

                        {/* Latitude (Input Text pour accepter les négatifs) */}
                        <GridItem colSpan={[2, 1]}>
                            <FormControl isInvalid={!!errors.lat}>
                                <FormLabel>Latitude</FormLabel>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Ex: -48.8698"
                                    {...register('lat')}
                                />
                                <FormErrorMessage>{errors.lat?.message}</FormErrorMessage>
                            </FormControl>
                        </GridItem>

                        {/* Longitude (Input Text pour accepter les négatifs) */}
                        <GridItem colSpan={[2, 1]}>
                            <FormControl isInvalid={!!errors.lng}>
                                <FormLabel>Longitude</FormLabel>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Ex: 2.3316"
                                    {...register('lng')}
                                />
                                <FormErrorMessage>{errors.lng?.message}</FormErrorMessage>
                            </FormControl>
                        </GridItem>
                    </Grid>

                    {/* --- Zone d'Upload et de Gestion des Photos --- */}
                    <FormControl>
                        <FormLabel>Gestion des Photos (Glisser pour modifier l'ordre des photos)</FormLabel>

                        <DragDropContext onDragEnd={onDragEnd}>
                            {renderPhotos()}
                        </DragDropContext>

                        <Box
                            {...getRootProps()}
                            minH="50px"
                            border="2px dashed"
                            borderColor="gray.300"
                            borderRadius="md"
                            p={3}
                            textAlign="center"
                            cursor="pointer"
                            bg="gray.50"
                            mt={4}
                        >
                            <input {...getInputProps()} />
                            <ChakraText fontSize="sm" color="gray.600">
                                Cliquez ou glissez de NOUVELLES photos ici pour les ajouter ({newFiles.length} en attente d'upload)
                            </ChakraText>
                        </Box>

                    </FormControl>

                    <Button
                        type="submit"
                        colorScheme="blue"
                        isLoading={isSubmitting}
                        leftIcon={<EditIcon />}
                        size="lg"
                        mt={4}
                    >
                        Enregistrer les modifications
                    </Button>
                </Stack>
            </Container>

            {/* Modal de confirmation de suppression de photo */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Supprimer la photo ?</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <ChakraText>Êtes-vous sûr de vouloir supprimer cette photo ?</ChakraText>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onClick={onDeleteClose} mr={3}>
                            Annuler
                        </Button>
                        <Button colorScheme="red" onClick={handleDeleteConfirm} leftIcon={<DeleteIcon />}>
                            Supprimer
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Layout>
    );
}
