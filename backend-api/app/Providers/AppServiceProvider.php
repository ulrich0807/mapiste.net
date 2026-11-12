<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Auth;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('profile-updates', fn (Request $request) =>
            Limit::perMinute(5)->by('profile:' . (Auth::guard('sanctum')->id() ?? $request->ip()))
        );
        RateLimiter::for('email-change-verification', fn (Request $request) =>
            Limit::perMinute(5)->by('email-change:' . (Auth::guard('sanctum')->id() ?? $request->ip()))
        );

        RateLimiter::for('lead-submissions', function (Request $request) {
            // Le limiteur peut etre execute avant le middleware facultatif.
            $user = Auth::guard('sanctum')->user();
            return [
                Limit::perHour(30)->by('lead-ip:' . $request->ip()),
                Limit::perHour($user ? 20 : 5)->by('lead-author:' . ($user ? $user->id : 'guest:' . $request->ip())),
            ];
        });

        ResetPassword::createUrlUsing(function ($user, string $token) {
            return rtrim(config('auth.frontend_url'), '/') . '/reinitialiser-mot-de-passe?'
                . http_build_query(['token' => $token, 'email' => $user->getEmailForPasswordReset()], '', '&', PHP_QUERY_RFC3986);
        });
    }
}
