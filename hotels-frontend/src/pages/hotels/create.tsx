import {
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Stack,
    Textarea,
    FormErrorMessage,
    useToast,
    Grid,
    GridItem,
    Image,
    CloseButton,
    Spinner,
    Text as ChakraText, // Renommé pour éviter les conflits avec React 19
    Link as ChakraLink,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import Link from 'next/link'; // Lien de navigation Next.js
import { useAuth } from '../../lib/auth';
import { Layout } from '../../components/Layout';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/router';
import axios from '../../lib/axios';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

// --- Définition du Schéma de Validation (inchangé, yup gère toujours le format numérique) ---
const schema = yup.object().shape({
    name: yup.string().required("Le nom est requis").max(255),
    address1: yup.string().required("L'adresse est requise"),
    address2: yup.string().nullable(),
    zipcode: yup.string().required("Le code postal est requis"),
    city: yup.string().required("La ville est requise"),
    country: yup.string().required("Le pays est requis"),
    // Les inputs sont de type 'text', mais yup.number() s'occupera de la conversion et de la validation de plage
    lat: yup.number().typeError('Doit être un nombre valide').min(-90, "Latitude invalide (Min: -90)").max(90, "Latitude invalide (Max: 90)").required("La latitude est requise"),
    lng: yup.number().typeError('Doit être un nombre valide').min(-180, "Longitude invalide (Min: -180)").max(180, "Longitude invalide (Max: 180)").required("La longitude est requise"),
    description: yup.string().nullable().max(5000, "La description est trop longue (max 5000)"),
    max_capacity: yup.number().typeError('Doit être un nombre entier').integer().min(1, "Min. 1 personne").max(200, "Max. 200 personnes").required("La capacité est requise"),
    price_per_night: yup.number().typeError('Doit être un nombre').min(0, "Le prix ne peut être négatif").required("Le prix est requis"),
});
type FormData = yup.InferType<typeof schema>;
// ------------------------------------------------------------------

export default function CreateHotel() {
    const { user } = useAuth({ middleware: 'auth' });
    const router = useRouter();
    const toast = useToast();
    const [files, setFiles] = useState<(File & { preview: string })[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        // Valeurs par défaut pour les NumberInputs
    } = useForm<FormData>({
        resolver: yupResolver(schema),
        defaultValues: {
            max_capacity: 1,
            price_per_night: 0,
            lat: 0,
            lng: 0,
        }
    });

    // --- Logique Dropzone (Glisser-Déposer) ---
    const { getRootProps, getInputProps } = useDropzone({
        accept: { 'image/*': ['.jpeg', '.png', '.webp'] },
        onDrop: (acceptedFiles) => {
            setFiles((prevFiles) => [
                ...prevFiles,
                ...acceptedFiles.map((file) =>
                    Object.assign(file, {
                        preview: URL.createObjectURL(file),
                    })
                ),
            ]);
        },
    });

    const removeFile = (file: File) => () => {
        const newFiles = files.filter(f => f !== file);
        setFiles(newFiles);
    };

    const thumbs = files.map((file) => (
        <GridItem key={file.name}>
            <Box boxSize="100px" position="relative">
                <Image
                    src={file.preview}
                    boxSize="100px"
                    objectFit="cover"
                    borderRadius="md"
                    onLoad={() => { URL.revokeObjectURL(file.preview) }}
                />
                <CloseButton size="sm" position="absolute" top={1} right={1} onClick={removeFile(file)} bg="whiteAlpha.700" />
            </Box>
        </GridItem>
    ));

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setIsSubmitting(true);
        let hotelId: number;

        try {
            const hotelResponse = await axios.post('/api/hotels', data);
            hotelId = hotelResponse.data.id;

            if (files.length > 0) {
                for (const file of files) {
                    const formData = new FormData();
                    formData.append('picture', file);
                    await axios.post(`/api/hotels/${hotelId}/pictures`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                }
            }

            toast({
                title: 'Hôtel créé',
                description: "L'hôtel a été ajouté avec succès.",
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            router.push('/');

        } catch (error: any) {
            console.error('Erreur de soumission:', error);
            setIsSubmitting(false);

            const errorMessage = error.response?.data?.message || "Une erreur est survenue lors de la création de l'hôtel.";

            toast({
                title: 'Erreur',
                description: errorMessage,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    if (!user) return <Layout><Container centerContent p={10}><Spinner size="xl" /></Container></Layout>;

    return (
        <Layout>
            <Container maxW="container.lg" py={5}>

                {/* --- LIEN RETOUR VERS LA LISTE (inchangé) --- */}
                <Link href="/" passHref>
                    <ChakraLink d="inline-flex" alignItems="center" mb={6} color="blue.500">
                        <ArrowBackIcon mr={2} />
                        Retour à la liste des hôtels
                    </ChakraLink>
                </Link>
                {/* ------------------------------- */}

                <Heading mb={6}>Ajouter un nouvel hôtel</Heading>

                <Stack as="form" spacing={4} onSubmit={handleSubmit(onSubmit)}>
                    {/* --- Nom --- */}
                    <FormControl isInvalid={!!errors.name}>
                        <FormLabel>Nom</FormLabel>
                        <Input {...register('name')} />
                        <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                    </FormControl>

                    {/* --- Adresse --- */}
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

                    {/* --- Description --- */}
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

                        {/* Latitude (REMIS EN INPUT TEXT pour accepter les négatifs sans validation navigateur) */}
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

                        {/* Longitude (REMIS EN INPUT TEXT pour accepter les négatifs sans validation navigateur) */}
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

                    {/* --- Zone d'Upload (Intégrée) --- */}
                    <FormControl>
                        <FormLabel>Photos</FormLabel>
                        <Box
                            {...getRootProps()}
                            minH="150px"
                            border="2px dashed"
                            borderColor="gray.300"
                            borderRadius="md"
                            p={6}
                            textAlign="center"
                            cursor="pointer"
                            display="flex"
                            flexDirection="column"
                            justifyContent={files.length === 0 ? 'center' : 'flex-start'}
                            alignItems="center"
                            role="group"
                        >
                            <input {...getInputProps()} />

                            {files.length === 0 ? (
                                <ChakraText color="gray.500" fontSize="lg">
                                    Glissez-déposez des photos ici, ou cliquez pour sélectionner
                                </ChakraText>
                            ) : (
                                <Grid
                                    templateColumns="repeat(auto-fill, minmax(100px, 1fr))"
                                    gap={4}
                                    mt={0}
                                    w="full"
                                >
                                    {thumbs}
                                </Grid>
                            )}
                        </Box>
                    </FormControl>

                    <Button
                        type="submit"
                        colorScheme="green"
                        isLoading={isSubmitting}
                        size="lg"
                        mt={4}
                    >
                        Enregistrer l'hôtel
                    </Button>
                </Stack>
            </Container>
        </Layout>
    );
}
