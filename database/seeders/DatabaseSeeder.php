<?php

namespace Database\Seeders;

use App\Models\Hotel;
use App\Models\HotelPicture;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {

        User::create([
            'name' => 'test technique',
            'email' => 'test@test-technique.fr',
            'password' => Hash::make('test-technique'),
            'email_verified_at' => now(),
        ]);

        $disk = Storage::disk('public');
        $files = $disk->files('pictures');

        $imageFiles = array_filter($files, function($file) {
            return str_ends_with($file, '.jpg');
        });

        shuffle($imageFiles);

        Hotel::factory(10)->create()->each(function ($hotel) use (&$imageFiles, $disk) {
            $hotelPhotos = array_splice($imageFiles, 0, 6);


            foreach ($hotelPhotos as $index => $filePath) {
                $hotel->pictures()->create([
                    'filepath' => $filePath,
                    'filesize' => $disk->size($filePath),
                    'position' => $index + 1,
                ]);
            }
        });
    }
}
