<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory;

    // Les coordonnees sont exposees uniquement par LeadResource apres autorisation.
    protected $hidden = ['telephone'];

    protected $casts = ['is_active' => 'boolean'];

    protected $fillable = [
        'user_id',
        'titre',
        'description',
        'budget',
        'localisation',
        'telephone',
        'is_active'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function purchases()
    {
        return $this->hasMany(LeadPurchase::class);
    }
}
