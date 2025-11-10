<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HotelController;
use App\Http\Controllers\HotelPictureController;


Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::apiResource('hotels', HotelController::class);

    Route::post('/hotels/{hotel}/pictures', [HotelPictureController::class, 'store']);
    Route::delete('/hotels/{hotel}/pictures/{picture}', [HotelPictureController::class, 'destroy']);
    Route::patch('/hotels/{hotel}/pictures/reorder', [HotelPictureController::class, 'reorder']); // CORRIGÉ
});
