<?php

namespace App\Http\Controllers;

use App\Models\Visite;
use App\Models\Annonce;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VisiteController extends Controller
{
    // Locataire : Programmer une visite
    public function programmerVisite(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'annonce_id' => 'required|exists:annonces,id',
            'date_visite' => 'required|date|after:today',
            'message' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 400);
        }

        $visite = Visite::create([
            'locataire_id' => $request->user()->id,
            'annonce_id' => $request->annonce_id,
            'date_visite' => $request->date_visite,
            'message' => $request->message,
            'statut' => 'en_attente'
        ]);

        $annonce = Annonce::with('user')->find($request->annonce_id);
        if ($annonce && $annonce->user) {
            $annonce->user->notify(new \App\Notifications\NouvelleVisite($visite));
        }

        return response()->json([
            'success' => true,
            'message' => 'Demande de visite envoyée avec succès',
            'data' => $visite
        ]);
    }

    // Propriétaire : Récupérer ses demandes de visites
    public function demandesRecues(Request $request)
    {
        $userId = $request->user()->id;

        $visites = Visite::whereHas('annonce', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })->with(['locataire', 'annonce'])->orderBy('date_visite', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $visites
        ]);
    }

    // Locataire : Récupérer ses visites programmées
    public function mesVisites(Request $request)
    {
        $visites = Visite::where('locataire_id', $request->user()->id)
            ->with(['annonce.user'])
            ->orderBy('date_visite', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $visites
        ]);
    }

    // Propriétaire : Valider / Refuser / Terminer une visite
    public function changerStatut(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'statut' => 'required|in:validee,annulee,terminee'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 400);
        }

        $visite = Visite::with('annonce')->find($id);

        if (!$visite || $visite->annonce->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Non autorisé ou visite introuvable'], 403);
        }

        $visite->statut = $request->statut;
        $visite->save();

        return response()->json([
            'success' => true,
            'message' => 'Statut de la visite mis à jour',
            'data' => $visite
        ]);
    }
}
