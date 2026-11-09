<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadPurchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LeadController extends Controller
{
    // Liste les demandes pour les professionnels (masque le téléphone si non acheté)
    public function index()
    {
        $leads = Lead::where('is_active', true)->get()->map(function ($lead) {
            // Vérifie si l'utilisateur connecté a acheté ce lead
            $hasPurchased = false;
            if (Auth::check()) {
                $hasPurchased = LeadPurchase::where('lead_id', $lead->id)
                    ->where('professional_id', Auth::id())
                    ->exists();
            }

            // Si non acheté, masquer le téléphone
            if (!$hasPurchased) {
                $lead->telephone = 'Masqué (Acheter pour voir)';
            }

            $lead->has_purchased = $hasPurchased; // Flag pour le frontend
            return $lead;
        });

        return response()->json($leads);
    }

    // Affiche un lead spécifique (vérifie l'achat)
    public function show(string $id)
    {
        $lead = Lead::findOrFail($id);
        
        $hasPurchased = false;
        if (Auth::check()) {
            $hasPurchased = LeadPurchase::where('lead_id', $lead->id)
                ->where('professional_id', Auth::id())
                ->exists();
        }

        if (!$hasPurchased) {
            $lead->telephone = 'Masqué';
        }
        $lead->has_purchased = $hasPurchased;

        return response()->json($lead);
    }

    // Créer une nouvelle demande (Client B2C)
    public function store(Request $request)
    {
        $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'required|string',
            'telephone' => 'required|string',
        ]);

        $lead = Lead::create([
            'user_id' => $request->user() ? $request->user()->id : null, // Si utilisateur authentifié
            'titre' => $request->titre,
            'description' => $request->description,
            'budget' => $request->budget,
            'localisation' => $request->localisation,
            'telephone' => $request->telephone,
            'is_active' => true
        ]);

        return response()->json(['message' => 'Demande créée avec succès', 'lead' => $lead], 201);
    }
}
