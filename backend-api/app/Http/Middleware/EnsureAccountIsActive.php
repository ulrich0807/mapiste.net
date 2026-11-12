<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user()->is_active) {
            return response()->json(['success' => false, 'code' => 'ACCOUNT_SUSPENDED', 'message' => 'Votre compte est suspendu.'], 403);
        }

        return $next($request);
    }
}
