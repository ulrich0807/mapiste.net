<?php

namespace App\Http\Controllers;

use App\Models\Annonce;
use App\Models\Decouverte;
use App\Models\User;
use App\Notifications\PublicationValidee;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    // Fonction de s�curit� interne
    private function checkAdmin(Request $request) {
        if (!$request->user() || !$request->user()->is_admin) {
            abort(403, 'Acc�s refus�. Vous n\'�tes pas administrateur.');
        }
    }

    // 1. R�cup�rer TOUTES les donn�es pour le Dashboard Admin
   // 1. R�cup�rer TOUTES les donn�es pour le Dashboard Admin
    public function getDashboardData(Request $request)
    {
        $this->checkAdmin($request);

        return response()->json([
            'success' => true,
            'data' => [
                'users' => User::latest()->get(),
                'annonces' => Annonce::with('user')->latest()->get(),
                'decouvertes' => Decouverte::with('user')->latest()->get(),
                'stats' => [
                    // Stats Utilisateurs
                    'total_users' => User::count(),
                    'users_actifs' => User::where('is_active', true)->count(),
                    'users_suspendus' => User::where('is_active', false)->count(),
                    
                    // Stats Immobilier
                    'total_annonces' => Annonce::count(),
                    'annonces_validees' => Annonce::where('est_valide', true)->count(),
                    'annonces_attente' => Annonce::where('est_valide', false)->count(),
                    
                    // Stats Annuaire
                    'total_decouvertes' => Decouverte::count(),
                    'decouvertes_validees' => Decouverte::where('est_valide', true)->count(),
                    'decouvertes_attente' => Decouverte::where('est_valide', false)->count(),
                ]
            ]
        ]);
    }

    // 2. Supprimer n'importe quelle annonce (Mod�ration)
    public function deleteAnnonce(Request $request, $id)
    {
        $this->checkAdmin($request);
        $annonce = Annonce::findOrFail($id);
        $annonce->delete();

        return response()->json(['success' => true, 'message' => 'Annonce supprim�e par la mod�ration.']);
    }

    // 3. Supprimer n'importe quel �tablissement (Mod�ration)
    public function deleteDecouverte(Request $request, $id)
    {
        $this->checkAdmin($request);
        $decouverte = Decouverte::findOrFail($id);
        $decouverte->delete();

        return response()->json(['success' => true, 'message' => 'Fiche annuaire supprim�e par la mod�ration.']);
    }

    // 4. Supprimer / Bannir un utilisateur
    public function deleteUser(Request $request, $id)
    {
        $this->checkAdmin($request);
        
        // On s'emp�che de se supprimer soi-m�me
        if ($request->user()->id == $id) {
            return response()->json(['success' => false, 'message' => 'Vous ne pouvez pas supprimer votre propre compte admin.'], 400);
        }

        $user = User::findOrFail($id);
        $user->delete(); // Gr�ce au "onDelete('cascade')" dans la BDD, cela supprimera aussi ses annonces !

        return response()->json(['success' => true, 'message' => 'Utilisateur banni et supprim�.']);
    }

    // ==========================================
    // NOUVELLES ACTIONS DE MOD�RATION
    // ==========================================

    // 1. Donner ou retirer le r�le Admin
    public function toggleAdmin(Request $request, $id)
    {
        $this->checkAdmin($request);
        
        if ($request->user()->id == $id) {
            return response()->json(['success' => false, 'message' => 'Impossible de modifier vos propres droits.'], 400);
        }

        $user = User::findOrFail($id);
        $user->is_admin = !$user->is_admin;
        $user->save();
        $user->tokens()->delete();

        $statut = $user->is_admin ? 'promu Administrateur' : 'r�trograd� au rang de Membre';
        return response()->json(['success' => true, 'message' => "L'utilisateur a �t� $statut."]);
    }

    // 2. Suspendre ou r�activer un compte
    public function toggleActive(Request $request, $id)
    {
        $this->checkAdmin($request);
        
        if ($request->user()->id == $id) {
            return response()->json(['success' => false, 'message' => 'Impossible de suspendre votre propre compte.'], 400);
        }

        $user = User::findOrFail($id);
        $user->is_active = !$user->is_active;
        $user->save();

        if (!$user->is_active) {
            $user->tokens()->delete();
        }

        $statut = $user->is_active ? 'r�activ�' : 'suspendu';
        return response()->json(['success' => true, 'message' => "Le compte de l'utilisateur a �t� $statut."]);
    }

    // 3. Valider (Approuver) une annonce immobili�re
    public function validerAnnonce(Request $request, $id)
    {
        $this->checkAdmin($request);
        $annonce = Annonce::findOrFail($id);
        $annonce->est_valide = true;
        $annonce->save();

        if ($annonce->user) {
            $annonce->user->notify(new PublicationValidee($annonce->titre, 'annonce'));
        }

        return response()->json(['success' => true, 'message' => 'Annonce approuv�e et publi�e.']);
    }

    // 4. Valider (Approuver) une fiche annuaire
    public function validerDecouverte(Request $request, $id)
    {
        $this->checkAdmin($request);
        $decouverte = Decouverte::findOrFail($id);
        $decouverte->est_valide = true;
        $decouverte->save();

        if ($decouverte->user) {
            $decouverte->user->notify(new PublicationValidee($decouverte->nom, 'decouverte'));
        }

        return response()->json(['success' => true, 'message' => '�tablissement approuv� et publi�.']);
    }
}
