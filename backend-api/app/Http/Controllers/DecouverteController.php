<?php

namespace App\Http\Controllers;

use App\Models\Decouverte;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class DecouverteController extends Controller
{
    // 1. (PUBLIC) R�cup�rer toutes les publications (Maquis, Artisans, etc.)
    public function index(Request $request)
    {
 $query = Decouverte::where('est_valide', true);

        // Filtre par cat�gorie (ex: restaurant, artisan)
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

    // 2. (PUBLIC) Afficher les d�tails d'un lieu/artisan sp�cifique
    public function show($id)
    {
        $decouverte = Decouverte::find($id);

        if (!$decouverte || !\App\Support\PublicationAccess::canView($decouverte)) {
            return response()->json(['success' => false, 'message' => 'Publication introuvable'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $decouverte
        ]);
    }

    // 3. (PROT�G�) Cr�er une nouvelle publication
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'categorie' => 'required|string',
            'description' => 'required|string',
            'commune' => 'required|string',
            'telephone' => 'required|string',
            'images' => 'sometimes|array|max:20',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 400);
        }

        // Gestion de la galerie d'images
        $urlsImages = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                // On range les images dans un dossier sp�cifique "decouvertes"
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
            'message' => 'Votre �tablissement/service a �t� publi� avec succ�s !',
            'data' => $decouverte
        ], 201);
    }

    // 4. (PROT�G�) R�cup�rer uniquement les publications de l'utilisateur connect�
    public function myDecouvertes(Request $request)
    {
        $decouvertes = Decouverte::where('user_id', $request->user()->id)->latest()->get();
        
        return response()->json([
            'success' => true,
            'data' => $decouvertes
        ]);
    }

    // 5. (PROT�G�) Supprimer sa publication
    public function destroy(Request $request, $id)
    {
        $decouverte = Decouverte::where('user_id', $request->user()->id)->find($id);

        if (!$decouverte) {
            return response()->json([
                'success' => false,
                'message' => 'Publication introuvable ou acc�s refus�.'
            ], 404);
        }

        $decouverte->delete();

        return response()->json([
            'success' => true,
            'message' => 'Publication supprim�e avec succ�s.'
        ]);
    }

    // (PROT�G�) Modifier un �tablissement/artisan existant
    public function update(Request $request, $id)
    {
        $decouverte = Decouverte::where('user_id', $request->user()->id)->find($id);

        if (!$decouverte) {
            return response()->json(['success' => false, 'message' => 'Publication introuvable ou acc�s refus�.'], 404);
        }

        $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'categorie' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'commune' => 'sometimes|required|string|max:255',
            'telephone' => 'sometimes|required|string|max:30',
            'images' => 'sometimes|array|max:20',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:4096',
        ]);

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
            'message' => '�tablissement modifi�. Il est en attente de validation.',
            'data' => $decouverte
        ]);
    }
}
