<?php

namespace App\Http\Controllers;

use App\Models\Annonce;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class AnnonceController extends Controller
{
    // R�cup�rer et filtrer dynamiquement les annonces immobili�res
    public function index(Request $request)
    {
        $query = Annonce::where('est_valide', true);

        // Filtre par commune
        if ($request->has('lieu') && !empty($request->lieu)) {
            $query->where('commune', 'like', '%' . $request->lieu . '%');
        }

        // Correspondance des onglets Angular ('louez', 'achetez', 'meuble')
        if ($request->has('type') && !empty($request->type)) {
            $type = $request->type;
            if ($type === 'louez') $query->where('type_contrat', 'location');
            if ($type === 'achetez') $query->where('type_contrat', 'vente');
            if ($type === 'meuble') $query->where('type_contrat', 'meuble');
        }

        // Filtre de budget maximum
        if ($request->has('prix') && $request->prix > 0) {
            $query->where('prix', '<=', $request->prix);
        }

        // Filtre par type de logement
        if ($request->has('type_logement') && !empty($request->type_logement)) {
            $query->where('type_logement', $request->type_logement);
        }

        // Filtres par nombre de pi�ces (recherche textuelle sur le titre)
        if ($request->has('pieces') && !empty($request->pieces)) {
            $query->where('titre', 'like', '%' . $request->pieces . '%');
        }

        // Filtres avanc�s (eau, electricite, ecoles, etc.)
        if ($request->has('filtres_avances')) {
            $filtres = json_decode($request->filtres_avances, true);
            if (is_array($filtres)) {
                foreach ($filtres as $filtre) {
                    $query->whereJsonContains('equipements', $filtre);
                }
            }
        }

        $annonces = $query->orderByRaw('CASE WHEN is_premium = 1 AND boosted_until > ? THEN 1 ELSE 0 END DESC', [now()])
                          ->latest()
                          ->paginate(15);

        // Calcul dynamique des compteurs de statistiques globaux pour l'accueil
        $stats = [
            'en_location' => Annonce::where('est_valide', true)->where('type_contrat', 'location')->count(),
            'en_vente' => Annonce::where('est_valide', true)->where('type_contrat', 'vente')->count(),
            'vendeurs' => \App\Models\User::count(), 
            'visiteurs' => 1450 // � dynamiser plus tard avec un vrai tracker
        ];

        // Agr�gation par commune pour alimenter la liste lat�rale et la carte Leaflet
        $communesStats = Annonce::where('est_valide', true)->select('commune', DB::raw('count(*) as total_logements'))
            ->groupBy('commune')
            ->get()
            ->map(function($item) {
                return [
                    'commune' => $item->commune,
                    'ville' => 'Abidjan',
                    'total_logements' => $item->total_logements
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $annonces,
            'communes' => $communesStats,
            'stats' => $stats
        ]);
    }

 // Enregistrer l'annonce avec l'utilisateur connect�
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titre' => 'required|string|max:255',
            'description' => 'required|string',
            'prix' => 'required|numeric',
            'commune' => 'required|string',
            'type_contrat' => 'required|string',
            'images_salon.*' => 'nullable|image|mimes:jpeg,png,jpg|max:4096',
            'images_chambre.*' => 'nullable|image|mimes:jpeg,png,jpg|max:4096',
            'images_cuisine.*' => 'nullable|image|mimes:jpeg,png,jpg|max:4096',
            'images_salle_de_bain.*' => 'nullable|image|mimes:jpeg,png,jpg|max:4096',
            'images_exterieur.*' => 'nullable|image|mimes:jpeg,png,jpg|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 400);
        }

        $imagesStructure = [];
        $categories = ['salon', 'chambre', 'cuisine', 'salle_de_bain', 'exterieur'];

        foreach ($categories as $cat) {
            $inputName = "images_$cat";
            if ($request->hasFile($inputName)) {
                $urls = [];
                foreach ($request->file($inputName) as $image) {
                    $path = $image->store("annonces/$cat", 'public');
                    $urls[] = asset('storage/' . $path);
                }
                $imagesStructure[$cat] = $urls;
            }
        }

        $annonce = Annonce::create([
            'user_id' => $request->user()->id, // <-- On associe l'ID de l'utilisateur connect� !
            'titre' => $request->titre,
            'description' => $request->description,
            'prix' => $request->prix,
            'caution' => $request->caution,
            'avances' => $request->avances,
            'commune' => $request->commune,
            'ville' => $request->input('ville', 'Abidjan'),
            'type_contrat' => $request->type_contrat,
            'type_logement' => $request->input('type_logement', 'appartement'),
            'equipements' => $request->has('equipements') ? json_decode($request->equipements, true) : null,
            'images' => json_encode($imagesStructure),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Votre annonce a �t� publi�e avec succ�s !',
            'data' => $annonce
        ], 201);
    }

    // R�cup�rer uniquement les annonces de l'utilisateur connect�
    public function myAnnonces(Request $request)
    {
        $annonces = Annonce::where('user_id', $request->user()->id)->latest()->get();
        
        return response()->json([
            'success' => true,
            'data' => $annonces
        ]);
    }

    // Supprimer une annonce appartenant � l'utilisateur connect�
    public function destroy(Request $request, $id)
    {
        $annonce = Annonce::where('user_id', $request->user()->id)->find($id);

        if (!$annonce) {
            return response()->json([
                'success' => false,
                'message' => 'Annonce introuvable ou vous n\'avez pas l\'autorisation de la supprimer.'
            ], 404);
        }

        $annonce->delete();

        return response()->json([
            'success' => true,
            'message' => 'L\'annonce a bien �t� supprim�e.'
        ]);
    }
    // Afficher les d�tails d'une annonce sp�cifique
    public function show($id)
    {
        $annonce = Annonce::find($id);

        if (!$annonce || !\App\Support\PublicationAccess::canView($annonce)) {
            return response()->json(['success' => false, 'message' => 'Annonce introuvable'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $annonce
        ]);
    }
    // (PROT�G�) Modifier une annonce existante
    public function update(Request $request, $id)
    {
        // 1. On cherche l'annonce, et on v�rifie qu'elle appartient bien � l'utilisateur connect�
        $annonce = Annonce::where('user_id', $request->user()->id)->find($id);

        if (!$annonce) {
            return response()->json(['success' => false, 'message' => 'Annonce introuvable ou acc�s refus�.'], 404);
        }

        if ($request->has('equipements') && is_string($request->equipements)) {
            $request->merge(['equipements' => json_decode($request->equipements, true)]);
        }
        if ($request->has('retained_images') && is_string($request->retained_images)) {
            $request->merge(['retained_images' => json_decode($request->retained_images, true)]);
        }

        $validator = Validator::make($request->all(), [
            'titre' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'prix' => 'sometimes|required|numeric|min:0',
            'commune' => 'nullable|string',
            'type_contrat' => 'nullable|string',
            'ville' => 'sometimes|required|string|max:255',
            'equipements' => 'sometimes|array',
            'equipements.*' => 'string|in:eau,electricite,ecoles,transports,travail',
            'retained_images' => 'sometimes|array:salon,chambre,cuisine,salle_de_bain,exterieur',
            'retained_images.*' => 'array',
            'retained_images.*.*' => 'string',
            'images_salon' => 'sometimes|array|max:20',
            'images_chambre' => 'sometimes|array|max:20',
            'images_cuisine' => 'sometimes|array|max:20',
            'images_salle_de_bain' => 'sometimes|array|max:20',
            'images_exterieur' => 'sometimes|array|max:20',
            'images_salon.*' => 'image|mimes:jpeg,png,jpg|max:4096',
            'images_chambre.*' => 'image|mimes:jpeg,png,jpg|max:4096',
            'images_cuisine.*' => 'image|mimes:jpeg,png,jpg|max:4096',
            'images_salle_de_bain.*' => 'image|mimes:jpeg,png,jpg|max:4096',
            'images_exterieur.*' => 'image|mimes:jpeg,png,jpg|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 400);
        }

        // 2. On met � jour les champs textes
        $annonce->titre = $request->titre ?? $annonce->titre;
        $annonce->description = $request->description ?? $annonce->description;
        $annonce->prix = $request->prix ?? $annonce->prix;
        $annonce->type_contrat = $request->type_contrat ?? $annonce->type_contrat;
        $annonce->commune = $request->commune ?? $annonce->commune;
        $annonce->ville = $request->ville ?? $annonce->ville;

        if ($request->has('equipements')) {
            $annonce->equipements = $request->equipements;
        }

        // Conserver uniquement les photos existantes choisies, puis ajouter les nouvelles.
        $images = json_decode($annonce->images ?? '{}', true) ?: [];
        $retained = $request->input('retained_images');
        foreach (['salon', 'chambre', 'cuisine', 'salle_de_bain', 'exterieur'] as $category) {
            $existing = $images[$category] ?? [];
            if ($retained !== null) {
                $requested = $retained[$category] ?? [];
                if (array_diff($requested, $existing)) {
                    return response()->json(['success' => false, 'message' => 'Photo existante invalide.'], 422);
                }
            }
        }
        foreach (['salon', 'chambre', 'cuisine', 'salle_de_bain', 'exterieur'] as $category) {
            $images[$category] = $retained !== null ? ($retained[$category] ?? []) : ($images[$category] ?? []);
            foreach ($request->file("images_$category", []) as $image) {
                $path = $image->store("annonces/$category", 'public');
                $images[$category][] = asset('storage/' . $path);
            }
        }
        $annonce->images = json_encode($images);

        // 4. LA R�GLE D'OR : On repasse l'annonce en "Attente de validation"
        $annonce->est_valide = false;
        
        $annonce->save();

        return response()->json([
            'success' => true,
            'message' => 'Annonce modifi�e avec succ�s. Elle est en attente de validation par un administrateur.',
            'data' => $annonce
        ]);
    }

    // Basculer l'�tat du favori
    public function toggleFavori(Request $request, $id)
    {
        $user = $request->user();
        $annonce = Annonce::find($id);

        if (!$annonce) {
            return response()->json(['success' => false, 'message' => 'Annonce introuvable'], 404);
        }

        if ($user->favoris()->where('annonce_id', $id)->exists()) {
            $user->favoris()->detach($id);
            $is_favori = false;
        } else {
            $user->favoris()->attach($id);
            $is_favori = true;
        }

        return response()->json([
            'success' => true,
            'is_favori' => $is_favori
        ]);
    }

    // Lister les favoris de l'utilisateur
    public function mesFavoris(Request $request)
    {
        $favoris = $request->user()->favoris()->where('est_valide', true)->with('user')->latest()->get();
        return response()->json([
            'success' => true,
            'data' => $favoris
        ]);
    }

    // Les boosts necessitent un paiement verifie cote serveur.
    public function boost(Request $request, $id)
    {
        return response()->json(['success' => false, 'message' => 'Les boosts payants ne sont pas encore disponibles.'], 503);
    }
}
