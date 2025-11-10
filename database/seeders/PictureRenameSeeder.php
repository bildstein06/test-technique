<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PictureRenameSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Utilise le disque 'public' (storage/app/public)
        $disk = Storage::disk('public');
        $files = $disk->files('pictures'); // Récupère les fichiers dans /pictures

        $this->command->info('Démarrage du renommage de ' . count($files) . ' fichiers...');

        foreach ($files as $file) {
            // Ignore les fichiers qui ne sont pas des .jpg
            if (strtolower(pathinfo($file, PATHINFO_EXTENSION)) !== 'jpg') {
                continue;
            }

            // Crée un nom unique
            $newName = 'pictures/' . Str::uuid() . '.jpg';

            // Renomme le fichier
            $disk->move($file, $newName);

            $this->command->line("Renommé: {$file} -> {$newName}");
        }

        $this->command->info('Renommage terminé.');
    }
}
