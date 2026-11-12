<?php

namespace App\Http\Controllers;

use App\Models\Annonce;
use App\Models\Decouverte;
use App\Models\User;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index()
    {
        // 1. Récupération des statistiques réelles
        $statistiques = [
            'total_biens' => Annonce::where('est_valide', true)->count(),
            'total_artisans' => Decouverte::where('est_valide', true)->count(),
            'total_villes' => Annonce::where('est_valide', true)->distinct('ville')->count('ville'),
            'total_users' => User::count()
        ];

   // Dans HomeController.php
        $annonces = Annonce::where('est_valide', true)->latest()->take(6)->get();
        $decouvertes = Decouverte::where('est_valide', true)->latest()->take(3)->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'statistiques' => $statistiques,
                'annonces' => $annonces,
                'decouvertes' => $decouvertes
            ]
        ]);
    }
}
