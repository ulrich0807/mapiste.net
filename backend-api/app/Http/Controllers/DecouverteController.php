<?php

namespace App\Http\Controllers;

use App\Models\Decouverte;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class DecouverteController extends Controller
{
    // 1. (PUBLIC) Récupérer toutes les publications (Maquis, Artisans, etc.)
    public function index(Request $request)
    {
 $query = Decouverte::where('est_valide', true);

        // Filtre par catégorie (ex: restaurant, artisan)
        if ($request->has('categorie') && !empty($request->categorie)) {
            $query->where('categorie', $request->categorie);
        }

        // Filtre par commune
        if ($request->has('commune') && !empty($request->commune)) {
            $query->where('commune', 'like', '%' . $request->commune . '%');
        }

        $decouvertes = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $decouvertes
        ]);
    }

    // 2. (PUBLIC) Afficher les détails d'un lieu/artisan spécifique
    public function show($id)
    {
        $decouverte = Decouverte::find($id);

        if (!$decouverte) {
            return response()->json(['success' => false, 'message' => 'Publication introuvable'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $decouverte
        ]);
    }

    // 3. (PROTÉGÉ) Créer une nouvelle publication
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'categorie' => 'required|string',
            'description' => 'required|string',
            'commune' => 'required|string',
            'telephone' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 400);
        }

        // Gestion de la galerie d'images
        $urlsImages = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                // On range les images dans un dossier spécifique "decouvertes"
                $path = $image->store('decouvertes', 'public');
                $urlsImages[] = asset('storage/' . $path);
            }
        }

        $decouverte = Decouverte::create([
            'user_id' => $request->user()->id,
            'nom' => $request->nom,
            'categorie' => $request->categorie,
            'description' => $request->description,
            'commune' => $request->commune,
            'telephone' => $request->telephone,
            'images' => json_encode($urlsImages), // On sauvegarde en JSON simple
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Votre établissement/service a été publié avec succès !',
            'data' => $decouverte
        ], 201);
    }

    // 4. (PROTÉGÉ) Récupérer uniquement les publications de l'utilisateur connecté
    public function myDecouvertes(Request $request)
    {
        $decouvertes = Decouverte::where('user_id', $request->user()->id)->latest()->get();
        
        return response()->json([
            'success' => true,
            'data' => $decouvertes
        ]);
    }

    // 5. (PROTÉGÉ) Supprimer sa publication
    public function destroy(Request $request, $id)
    {
        $decouverte = Decouverte::where('user_id', $request->user()->id)->find($id);

        if (!$decouverte) {
            return response()->json([
                'success' => false,
                'message' => 'Publication introuvable ou accès refusé.'
            ], 404);
        }

        $decouverte->delete();

        return response()->json([
            'success' => true,
            'message' => 'Publication supprimée avec succès.'
        ]);
    }

    // (PROTÉGÉ) Modifier un établissement/artisan existant
    public function update(Request $request, $id)
    {
        $decouverte = Decouverte::where('user_id', $request->user()->id)->find($id);

        if (!$decouverte) {
            return response()->json(['success' => false, 'message' => 'Publication introuvable ou accès refusé.'], 404);
        }

        $decouverte->nom = $request->nom ?? $decouverte->nom;
        $decouverte->categorie = $request->categorie ?? $decouverte->categorie;
        $decouverte->description = $request->description ?? $decouverte->description;
        $decouverte->commune = $request->commune ?? $decouverte->commune;
        $decouverte->telephone = $request->telephone ?? $decouverte->telephone;

        if ($request->hasFile('images')) {
            $urlsImages = [];
            foreach ($request->file('images') as $image) {
                $path = $image->store('decouvertes', 'public');
                $urlsImages[] = asset('storage/' . $path);
            }
            $decouverte->images = json_encode($urlsImages);
        }

        // Repasse en attente de validation
        $decouverte->est_valide = false;
        
        $decouverte->save();

        return response()->json([
            'success' => true,
            'message' => 'Établissement modifié. Il est en attente de validation.',
            'data' => $decouverte
        ]);
    }
}