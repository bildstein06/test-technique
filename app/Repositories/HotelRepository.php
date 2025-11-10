<?php

namespace App\Repositories;

use App\Models\Hotel;
use Illuminate\Http\Request;
use App\Repositories\Contracts\HotelRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

// Importez Schema pour la validation

class HotelRepository implements HotelRepositoryInterface
{
    /**
     * @var array Colonnes autorisées pour le tri.
     */
    protected $allowedSorts = [
        'name',
        'city',
        'price_per_night'
    ];

    public function all(Request $request): LengthAwarePaginator
    {
        $query = Hotel::query()->with('pictures');

        // --- Filtre (q=) ---
        if ($request->has('q')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->q . '%')
                    ->orWhere('city', 'like', '%' . $request->q . '%');
            });
        }

        // --- Tri (sort= & order=) (CORRIGÉ) ---

        // Récupère la colonne de tri demandée, 'name' par défaut
        $sortColumn = $request->get('sort', 'name');

        // Récupère l'ordre (asc ou desc), 'asc' par défaut
        $sortOrder = $request->get('order', 'asc');

        // Validation de sécurité :
        // 1. La colonne est-elle dans notre liste autorisée ?
        // 2. L'ordre est-il bien 'asc' ou 'desc' ?
        if (in_array($sortColumn, $this->allowedSorts) && in_array(strtolower($sortOrder), ['asc', 'desc'])) {
            $query->orderBy($sortColumn, $sortOrder);
        } else {
            // Si le tri demandé n'est pas valide, on applique le tri par défaut
            $query->orderBy('name', 'asc');
        }

        // --- Pagination (per_page=) ---
        return $query->paginate($request->get('per_page', 5));
    }

    public function create(array $data): Hotel
    {
        return Hotel::create($data);
    }

    public function find(string $id): ?Hotel
    {
        return Hotel::find($id);
    }

    public function update(Hotel $hotel, array $data): Hotel
    {
        $hotel->update($data);
        return $hotel;
    }

    public function delete(Hotel $hotel): bool
    {
        foreach ($hotel->pictures as $picture) {
            if (Storage::disk('public')->exists($picture->filepath)) {
                Storage::disk('public')->delete($picture->filepath);
            }
        }
        return $hotel->delete();
    }
}
