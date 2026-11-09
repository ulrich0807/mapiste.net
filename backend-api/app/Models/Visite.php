<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visite extends Model
{
    use HasFactory;

    protected $fillable = [
        'locataire_id',
        'annonce_id',
        'date_visite',
        'statut',
        'message',
    ];

    protected $casts = [
        'date_visite' => 'datetime',
    ];

    public function locataire()
    {
        return $this->belongsTo(User::class, 'locataire_id');
    }

    public function annonce()
    {
        return $this->belongsTo(Annonce::class);
    }
}
