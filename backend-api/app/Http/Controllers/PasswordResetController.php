<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    public function sendLink(Request $request)
    {
        $data = $request->validate(['email' => 'required|email|max:255']);

        // Meme reponse pour un compte absent, suspendu ou deja sollicite.
        if (User::where('email', $data['email'])->where('is_active', true)->exists()) {
            Password::sendResetLink($data);
        }

        return response()->json([
            'success' => true,
            'message' => 'Si ce compte existe, un lien de reinitialisation vous sera envoye.',
        ]);
    }

    public function reset(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|max:255',
            'token' => 'required|string|max:255',
            'password' => 'required|string|min:8|max:128|confirmed',
        ]);

        $user = User::where('email', $data['email'])->where('is_active', true)->first();
        if (!$user) {
            return $this->invalidLink();
        }

        $status = Password::reset($data, function (User $user, string $password) {
            DB::transaction(function () use ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                    'pending_email' => null,
                    'email_change_code_hash' => null,
                    'email_change_expires_at' => null,
                    'email_change_attempts' => 0,
                ])->save();
                $user->tokens()->delete();
            });
            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            return $this->invalidLink();
        }

        return response()->json([
            'success' => true,
            'message' => 'Votre mot de passe a ete modifie. Vous pouvez vous reconnecter.',
        ]);
    }

    private function invalidLink()
    {
        return response()->json([
            'success' => false,
            'message' => 'Ce lien est invalide ou expire. Demandez un nouveau lien.',
        ], 422);
    }
}
