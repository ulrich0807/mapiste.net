<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function getUnread()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Non autorisé'], 401);
        }

        $notifications = $user->unreadNotifications;

        return response()->json([
            'count' => $notifications->count(),
            'notifications' => $notifications
        ]);
    }

    public function markAsRead($id)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Non autorisé'], 401);
        }

        $notification = $user->notifications()->find($id);
        
        if ($notification) {
            $notification->markAsRead();
            return response()->json(['message' => 'Notification marquée comme lue']);
        }

        return response()->json(['message' => 'Notification introuvable'], 404);
    }
    
    public function markAllAsRead()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Non autorisé'], 401);
        }

        $user->unreadNotifications->markAsRead();

        return response()->json(['message' => 'Toutes les notifications ont été marquées comme lues']);
    }
}
