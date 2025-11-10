<?php

namespace App\Repositories\Contracts;

use App\Models\Hotel;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface HotelRepositoryInterface
{
    public function all(Request $request): LengthAwarePaginator;

    public function create(array $data): Hotel;

    public function find(string $id): ?Hotel;

    public function update(Hotel $hotel, array $data): Hotel;

    public function delete(Hotel $hotel): bool;
}
