<?php

namespace App\Support;

use Illuminate\Support\Facades\Auth;

class PublicationAccess
{
    public static function canView($publication): bool
    {
        if ($publication->est_valide) {
            return true;
        }

        $user = Auth::guard('sanctum')->user();

        return $user && $user->is_active
            && ($user->is_admin || (int) $publication->user_id === (int) $user->id);
    }
}
