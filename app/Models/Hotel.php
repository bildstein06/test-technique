<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Hotel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'address1', 'address2', 'zipcode', 'city', 'country',
        'lng', 'lat', 'description', 'max_capacity', 'price_per_night',
    ];

    protected $appends = ['thumbnail_url'];

    public function pictures(): HasMany
    {
        return $this->hasMany(HotelPicture::class)->orderBy('position', 'asc');
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        $firstPicture = $this->pictures->first();

        if ($firstPicture) {
            return Storage::disk('public')->url($firstPicture->filepath);
        }

        return null;
    }
}
