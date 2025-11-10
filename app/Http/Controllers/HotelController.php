<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreHotelRequest;
use App\Http\Requests\UpdateHotelRequest;
use App\Models\Hotel;
use App\Repositories\Contracts\HotelRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HotelController extends Controller
{
    protected $hotelRepository;
    public function __construct(HotelRepositoryInterface $hotelRepository)
    {
        $this->hotelRepository = $hotelRepository;
    }
    public function index(Request $request): JsonResponse
    {
        $hotels = $this->hotelRepository->all($request);
        return response()->json($hotels);
    }

    public function store(StoreHotelRequest $request): JsonResponse
    {
        $hotel = $this->hotelRepository->create($request->validated());
        return response()->json($hotel, Response::HTTP_CREATED);
    }

    public function show(Hotel $hotel): JsonResponse
    {
        return response()->json($hotel);
    }

    public function update(UpdateHotelRequest $request, Hotel $hotel): JsonResponse
    {
        $updatedHotel = $this->hotelRepository->update($hotel, $request->validated());
        return response()->json($updatedHotel);
    }

    public function destroy(Hotel $hotel): JsonResponse
    {
        $this->hotelRepository->delete($hotel);
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
