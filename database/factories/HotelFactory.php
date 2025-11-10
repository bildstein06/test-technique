<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class HotelFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->company . ' Hotel',
            'address1' => $this->faker->streetAddress,
            'address2' => null,
            'zipcode' => $this->faker->postcode,
            'city' => $this->faker->city,
            'country' => $this->faker->countryCode,
            'lng' => $this->faker->longitude(-180, 180),
            'lat' => $this->faker->latitude(-90, 90),
            'description' => $this->faker->paragraph(3),
            'max_capacity' => $this->faker->numberBetween(10, 200),
            'price_per_night' => $this->faker->randomFloat(2, 50, 500),
        ];
    }
}
