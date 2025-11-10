<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use App\Models\HotelPicture;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class HotelPictureController extends Controller
{
    public function store(Request $request, Hotel $hotel)
    {
        $request->validate([
            'picture' => 'required|image|mimes:jpeg,png,webp|max:5120',
        ]);

        if ($request->hasFile('picture')) {
            $file = $request->file('picture');

            $extension = $file->getClientOriginalExtension();
            $filename = (string) Str::uuid() . '.' . $extension;

            $storageSubdirectory = 'pictures';

            $fullPath = $file->storeAs($storageSubdirectory, $filename, 'public');
            $filesize = $file->getSize();

            $position = $hotel->pictures()->max('position') + 1;

            $picture = $hotel->pictures()->create([
                'filepath' => $fullPath,
                'filesize' => $filesize,
                'position' => $position,
            ]);

            return response()->json($picture, Response::HTTP_CREATED);
        }

        return response()->json(['message' => 'Fichier non fourni.'], Response::HTTP_BAD_REQUEST);
    }

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

        $count = $hotel->pictures()->whereIn('id', $pictureIds)->count();
        if ($count !== count($pictureIds)) {
            return response()->json(['message' => 'Un ou plusieurs IDs de photos ne correspondent pas à cet hôtel.'], Response::HTTP_FORBIDDEN);
        }

        foreach ($pictureIds as $index => $pictureId) {
            HotelPicture::where('id', $pictureId)
                ->update(['position' => $index + 1]);
        }
    }
}
