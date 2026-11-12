<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class EmailChangeController extends Controller
{
    public function verify(Request $request)
    {
        $data = $request->validate(['code' => 'required|string|regex:/^[0-9]{6}$/']);

        try {
            return DB::transaction(function () use ($request, $data) {
                $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
                if (!$user->pending_email || !$user->email_change_code_hash
                    || !$user->email_change_expires_at || $user->email_change_expires_at->isPast()
                    || $user->email_change_attempts >= 5) {
                    return $this->invalidCode();
                }
                if (!Hash::check($data['code'], $user->email_change_code_hash)) {
                    $user->email_change_attempts++;
                    if ($user->email_change_attempts >= 5) $user->email_change_code_hash = null;
                    $user->save();
                    return $this->invalidCode();
                }

                Validator::make(['email' => $user->pending_email], [
                    'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
                ])->validate();

                $previousEmail = $user->email;
                $user->email = $user->pending_email;
                $user->email_verified_at = now();
                $user->otp_code = null;
                $user->otp_expires_at = null;
                $this->clearPending($user);
                $user->tokens()->delete();
                DB::table('password_reset_tokens')->whereIn('email', [$previousEmail, $user->email])->delete();

                return response()->json([
                    'success' => true,
                    'message' => 'Adresse confirmee. Reconnectez-vous avec votre nouvelle adresse.',
                    'reauthenticate' => true,
                ])->header('Cache-Control', 'private, no-store');
            });
        } catch (UniqueConstraintViolationException $exception) {
            return response()->json(['success' => false, 'message' => 'Cette adresse est deja utilisee.'], 422);
        }
    }

    public function cancel(Request $request)
    {
        DB::transaction(function () use ($request) {
            $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $this->clearPending($user);
        });

        return response()->json(['success' => true, 'message' => 'Changement d’adresse annule.']);
    }

    private function clearPending(User $user): void
    {
        $user->pending_email = null;
        $user->email_change_code_hash = null;
        $user->email_change_expires_at = null;
        $user->email_change_attempts = 0;
        $user->save();
    }

    private function invalidCode()
    {
        return response()->json([
            'success' => false,
            'message' => 'Code incorrect, expire ou bloque. Demandez un nouveau code depuis votre profil.',
        ], 422);
    }
}
