<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MessageController extends Controller
{
    // Récupérer la liste des conversations de l'utilisateur connecté
    public function getConversations(Request $request)
    {
        $userId = $request->user()->id;

        // 1. Trouver tous les interlocuteurs distincts (IDs)
        $interlocuteursIds = Message::where('sender_id', $userId)
            ->select('receiver_id as user_id')
            ->union(
                Message::where('receiver_id', $userId)->select('sender_id as user_id')
            )
            ->pluck('user_id');

        $contacts = [];

        // 2. Récupérer le dernier message et le décompte des non-lus pour chaque interlocuteur
        foreach ($interlocuteursIds as $interlocuteurId) {
            $lastMessage = Message::where(function ($query) use ($userId, $interlocuteurId) {
                    $query->where('sender_id', $userId)->where('receiver_id', $interlocuteurId);
                })
                ->orWhere(function ($query) use ($userId, $interlocuteurId) {
                    $query->where('sender_id', $interlocuteurId)->where('receiver_id', $userId);
                })
                ->orderBy('created_at', 'desc')
                ->first();

            $nonLus = Message::where('sender_id', $interlocuteurId)
                ->where('receiver_id', $userId)
                ->where('is_read', false)
                ->count();

            $interlocuteur = User::find($interlocuteurId);

            if ($interlocuteur && $lastMessage) {
                $contacts[] = [
                    'interlocuteur' => $interlocuteur,
                    'dernier_message' => $lastMessage->contenu,
                    'date' => $lastMessage->created_at,
                    'non_lus' => $nonLus
                ];
            }
        }

        // 3. Trier par date du dernier message (du plus récent au plus ancien)
        usort($contacts, function ($a, $b) {
            return $b['date'] <=> $a['date'];
        });

        return response()->json([
            'success' => true,
            'data' => array_values($contacts)
        ]);
    }

    // Récupérer les messages avec un utilisateur spécifique
    public function getMessages(Request $request, $interlocuteurId)
    {
        $userId = $request->user()->id;

        $messages = Message::where(function ($query) use ($userId, $interlocuteurId) {
            $query->where('sender_id', $userId)->where('receiver_id', $interlocuteurId);
        })->orWhere(function ($query) use ($userId, $interlocuteurId) {
            $query->where('sender_id', $interlocuteurId)->where('receiver_id', $userId);
        })->orderBy('created_at', 'asc')->get();

        // Marquer comme lus
        Message::where('sender_id', $interlocuteurId)
            ->where('receiver_id', $userId)
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'data' => $messages
        ]);
    }

    // Envoyer un message
    public function sendMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|exists:users,id',
            'contenu' => 'required|string',
            'annonce_id' => 'nullable|exists:annonces,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 400);
        }

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $request->receiver_id,
            'annonce_id' => $request->annonce_id,
            'contenu' => $request->contenu,
            'is_read' => false
        ]);

        $receiver = User::find($request->receiver_id);
        if ($receiver) {
            $receiver->notify(new \App\Notifications\NouveauMessage($message));
        }

        return response()->json([
            'success' => true,
            'message' => 'Message envoyé',
            'data' => $message
        ]);
    }
}
