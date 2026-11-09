<?php

namespace App\Http\Controllers;

use App\Models\Avis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AvisController extends Controller
{
    // Laisser un avis sur une annonce ou un utilisateur
    public function laisserAvis(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'target_id' => 'nullable|exists:users,id',
            'annonce_id' => 'nullable|exists:annonces,id',
            'note' => 'required|integer|min:1|max:5',
            'commentaire' => 'nullable|string'
        ]);

        if ($validator->fails() || (!$request->target_id && !$request->annonce_id)) {
            return response()->json(['success' => false, 'message' => 'Données invalides'], 400);
        }

        $avis = Avis::create([
            'user_id' => $request->user()->id,
            'target_id' => $request->target_id,
            'annonce_id' => $request->annonce_id,
            'note' => $request->note,
            'commentaire' => $request->commentaire,
            'is_approved' => true // Peut être passé à false si on veut de la modération a priori
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Votre avis a été publié',
            'data' => $avis
        ]);
    }

    // Récupérer les avis d'une annonce
    public function avisAnnonce($id)
    {
        $avis = Avis::where('annonce_id', $id)->where('is_approved', true)->with('user')->get();
        
        return response()->json([
            'success' => true,
            'data' => $avis
        ]);
    }
}
