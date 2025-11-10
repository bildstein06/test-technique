<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class HotelPicture extends Model
{
    protected $fillable = [
        'hotel_id', 'filepath', 'filesize', 'position',
    ];

    // Ajouter la relation inverse
    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }
}
