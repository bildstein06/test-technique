<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use App\Models\HotelPicture;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage; // <-- Réintroduit Storage
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
// On supprime l'importation de File car nous n'utilisons plus public_path()

class HotelPictureController extends Controller
{
    /**
     * Stocke une nouvelle photo dans le disque 'public' (storage/app/public).
     */
    public function store(Request $request, Hotel $hotel)
    {
        // Validation: (inchangée)
        $request->validate([
            'picture' => 'required|image|mimes:jpeg,png,webp|max:5120',
        ]);

        if ($request->hasFile('picture')) {
            $file = $request->file('picture');

            // 1. Déterminer le nom de fichier par UUID
            $extension = $file->getClientOriginalExtension();
            $filename = (string) Str::uuid() . '.' . $extension;

            // 2. Le dossier cible est 'pictures' DANS storage/app/public
            $storageSubdirectory = 'pictures';

            // 3. Stocker le fichier en utilisant le disque 'public'
            // Ceci utilise Storage::disk('public')->putFileAs, ce qui est plus sécurisé
            $fullPath = $file->storeAs($storageSubdirectory, $filename, 'public');
            $filesize = $file->getSize();

            // 4. Calculer la position
            $position = $hotel->pictures()->max('position') + 1;

            // 5. Créer l'enregistrement en base de données
            $picture = $hotel->pictures()->create([
                'filepath' => $fullPath, // Ex: 'pictures/UUID.jpg'
                'filesize' => $filesize,
                'position' => $position,
            ]);

            return response()->json($picture, Response::HTTP_CREATED);
        }

        return response()->json(['message' => 'Fichier non fourni.'], Response::HTTP_BAD_REQUEST);
    }

    /**
     * Supprime une photo du disque 'public'.
     */
    public function destroy(Hotel $hotel, HotelPicture $picture)
    {
        if ($picture->hotel_id !== $hotel->id) {
            return response()->json(['message' => 'Non autorisé'], Response::HTTP_FORBIDDEN);
        }

        Storage::disk('public')->delete($picture->filepath);

        $picture->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function reorder(Request $request, Hotel $hotel)
    {
        $request->validate([
            'picture_ids' => 'required|array',
            'picture_ids.*' => 'integer|exists:hotel_pictures,id',
        ]);

        $pictureIds = $request->input('picture_ids');

        // Vérifier la propriété (tous les IDs doivent appartenir à cet hôtel)
        $count = $hotel->pictures()->whereIn('id', $pictureIds)->count();
        if ($count !== count($pictureIds)) {
            return response()->json(['message' => 'Un ou plusieurs IDs de photos ne correspondent pas à cet hôtel.'], Response::HTTP_FORBIDDEN);
        }

        // Mettre à jour la position pour chaque ID
        foreach ($pictureIds as $index => $pictureId) {
            HotelPicture::where('id', $pictureId)
                ->update(['position' => $index + 1]);
        }
    }
}
