<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use App\Mail\VerifyOtpMail;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function profile(Request $request)
    {
        return response()->json($this->profileData($request->user()))
            ->header('Cache-Control', 'private, no-store');
    }

    private function profileData(User $user): array
    {
        return array_merge($user->toArray(), ['pending_email' => $user->pending_email]);
    }

    // Inscription d'un nouvel utilisateur
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|unique:users',
            'role' => 'nullable|in:locataire,proprietaire',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 400);
        }

        $otpCode = (string) random_int(100000, 999999);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'role' => $request->role ?? 'locataire',
            'password' => Hash::make($request->password),
            'otp_code' => $otpCode,
            'otp_expires_at' => Carbon::now()->addMinutes(15),
        ]);

        // Envoi de l'email
        Mail::to($user->email)->send(new VerifyOtpMail($otpCode, $user->name));

        return response()->json([
            'success' => true,
            'message' => 'OTP_REQUIRED',
            'user' => $user
        ], 201);
    }

    // Connexion d'un utilisateur existant
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 400);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Identifiants incorrects.'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json(['success' => false, 'message' => 'Votre compte est suspendu.'], 403);
        }

        if (is_null($user->email_verified_at)) {
            // Renvoyer un code s'il est expiré ou manquant
            if (is_null($user->otp_code) || Carbon::now()->greaterThan($user->otp_expires_at)) {
                $user->otp_code = (string) random_int(100000, 999999);
                $user->otp_expires_at = Carbon::now()->addMinutes(15);
                $user->save();
                Mail::to($user->email)->send(new VerifyOtpMail($user->otp_code, $user->name));
            }
            return response()->json([
                'success' => false,
                'message' => 'OTP_REQUIRED'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie !',
            'token' => $token,
            'user' => $user
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp_code' => 'required|string|regex:/^[0-9]{6}$/',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 400);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Utilisateur introuvable.'], 404);
        }

        if (!$user->is_active) {
            return response()->json(['success' => false, 'message' => 'Votre compte est suspendu.'], 403);
        }

        if (!$user->otp_code || !hash_equals((string) $user->otp_code, $request->otp_code)) {
            return response()->json(['success' => false, 'message' => 'Code de vérification incorrect.'], 400);
        }

        if (!$user->otp_expires_at || Carbon::now()->greaterThan($user->otp_expires_at)) {
            return response()->json(['success' => false, 'message' => 'Le code de vérification a expiré.'], 400);
        }

        // Succès
        $user->email_verified_at = Carbon::now();
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Compte vérifié avec succès.',
            'token' => $token,
            'user' => $user
        ]);
    }

    public function resendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 400);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Utilisateur introuvable.'], 404);
        }

        if (!is_null($user->email_verified_at)) {
            return response()->json(['success' => false, 'message' => 'Compte déjà vérifié.'], 400);
        }

        if (!$user->is_active) {
            return response()->json(['success' => false, 'message' => 'Votre compte est suspendu.'], 403);
        }

        $user->otp_code = (string) random_int(100000, 999999);
        $user->otp_expires_at = Carbon::now()->addMinutes(15);
        $user->save();

        Mail::to($user->email)->send(new VerifyOtpMail($user->otp_code, $user->name));

        return response()->json([
            'success' => true,
            'message' => 'Un nouveau code a été envoyé à votre adresse email.'
        ]);
    }

    // Déconnexion (Révocation du token)
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie.'
        ]);
    }

    // Mise à jour du profil (Informations + Avatar)
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,'.$user->id,
            'phone' => 'nullable|string|max:30|unique:users,phone,'.$user->id,
            'current_password' => 'nullable|string|max:128',
            'role' => 'prohibited',
            'is_admin' => 'prohibited',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 400);
        }

        $changingEmail = $request->filled('email') && strcasecmp($request->email, $user->email) !== 0;
        if ($changingEmail && (!$request->filled('current_password') || !Hash::check($request->current_password, $user->password))) {
            return response()->json([
                'success' => false,
                'message' => 'Votre mot de passe actuel est necessaire pour changer d’adresse e-mail.',
            ], 422);
        }

        $code = null;
        if ($changingEmail) {
            $code = (string) random_int(100000, 999999);
            $user->pending_email = $request->email;
            $user->email_change_code_hash = Hash::make($code);
            $user->email_change_expires_at = now()->addMinutes(15);
            $user->email_change_attempts = 0;
        }

        if ($request->has('name')) $user->name = $request->name;
        if ($request->has('phone')) $user->phone = $request->phone;

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = url('storage/' . $path);
        }

        $user->save();

        if ($code !== null) {
            Mail::to($user->pending_email)->send(new \App\Mail\EmailChangeCode($code, $user->name));
        }

        return response()->json([
            'success' => true,
            'message' => $changingEmail
                ? 'Profil enregistre. Confirmez le code envoye a votre nouvelle adresse.'
                : 'Profil mis à jour avec succès.',
            'email_verification_required' => (bool) $user->pending_email,
            'user' => $this->profileData($user),
        ])->header('Cache-Control', 'private, no-store');
    }
}
