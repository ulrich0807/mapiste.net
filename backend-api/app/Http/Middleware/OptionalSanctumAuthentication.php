<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OptionalSanctumAuthentication
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::guard('sanctum')->user();
        if ($request->bearerToken() && !$user) {
            return response()->json(['message' => 'Session invalide ou expiree.'], 401);
        }
        if ($user && !$user->is_active) {
            return response()->json(['code' => 'ACCOUNT_SUSPENDED', 'message' => 'Votre compte est suspendu.'], 403);
        }

        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
