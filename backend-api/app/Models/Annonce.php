<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Annonce extends Model
{
    use HasFactory; // <-- LA MAGIE EST ICI

    protected $fillable = [
        'user_id',
        'titre', 
        'description', 
        'prix',
        'caution',
        'avances', 
        'commune', 
        'ville',
        'type_contrat',
        'type_logement',
        'equipements',
        'statut',
        'images',
        'is_premium',
        'boosted_until'
    ];

    protected $casts = [
        'equipements' => 'array',
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function favoritedBy()
    {
        return $this->belongsToMany(User::class, 'annonce_user_favoris');
    }

    public function visites()
    {
        return $this->hasMany(Visite::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function avis()
    {
        return $this->hasMany(Avis::class);
    }
}