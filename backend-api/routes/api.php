<?php

use App\Http\Controllers\AnnonceController;
use App\Http\Controllers\DecouverteController; // <-- N'oublie pas l'import du nouveau contrôleur !
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController; // Ajoute l'import en haut
use App\Http\Controllers\AdminController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\VisiteController;
use App\Http\Controllers\AvisController;
use App\Http\Controllers\NotificationController;

// ==========================================
// 🔓 ROUTES PUBLIQUES (Pas besoin de connexion)
// ==========================================
Route::get('/home-data', [HomeController::class, 'index']);
// Immobilier
Route::get('/annonces', [AnnonceController::class, 'index']);
Route::get('/annonces/{id}', [AnnonceController::class, 'show']);
Route::get('/annonces/{id}/avis', [AvisController::class, 'avisAnnonce']);

// Découverte de la CI (Maquis, Artisans, etc.)
Route::get('/decouvertes', [DecouverteController::class, 'index']);
Route::get('/decouvertes/{id}', [DecouverteController::class, 'show']);

// Pay-Per-Lead (Public)
Route::get('/leads', [\App\Http\Controllers\LeadController::class, 'index']);
Route::get('/leads/{id}', [\App\Http\Controllers\LeadController::class, 'show']);
Route::post('/leads', [\App\Http\Controllers\LeadController::class, 'store']);

// Webhook de paiement (ne doit pas être protégé par auth)
Route::post('/payment/callback', [\App\Http\Controllers\PaymentController::class, 'paymentCallback']);

// Authentification
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/resend-otp', [AuthController::class, 'resendOtp']);

// ==========================================
// 🔒 ROUTES PROTÉGÉES (Réservées aux connectés)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    
    // Gestion Immobilier
    Route::post('/annonces', [AnnonceController::class, 'store']);
    Route::get('/mes-annonces', [AnnonceController::class, 'myAnnonces']);
    Route::delete('/annonces/{id}', [AnnonceController::class, 'destroy']);
    Route::post('/annonces/{id}/boost', [AnnonceController::class, 'boost']);
    
    // Gestion Découverte CI
    Route::post('/payment/initiate', [\App\Http\Controllers\PaymentController::class, 'initiatePayment']);

    Route::post('/decouvertes', [DecouverteController::class, 'store']);
    Route::get('/mes-decouvertes', [DecouverteController::class, 'myDecouvertes']);
    Route::delete('/decouvertes/{id}', [DecouverteController::class, 'destroy']);
    
    // Déconnexion & Profil
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/user/update', [AuthController::class, 'updateProfile']);

    // Favoris
    Route::post('/annonces/{id}/favoris', [AnnonceController::class, 'toggleFavori']);
    Route::get('/mes-favoris', [AnnonceController::class, 'mesFavoris']);

    // Messagerie
    Route::get('/messages', [MessageController::class, 'getConversations']);
    Route::get('/messages/{interlocuteurId}', [MessageController::class, 'getMessages']);
    Route::post('/messages', [MessageController::class, 'sendMessage']);

    // Visites
    Route::post('/visites', [VisiteController::class, 'programmerVisite']);
    Route::get('/mes-visites', [VisiteController::class, 'mesVisites']);
    Route::get('/demandes-visites', [VisiteController::class, 'demandesRecues']);
    Route::post('/visites/{id}/statut', [VisiteController::class, 'changerStatut']);

    // Avis
    Route::post('/avis', [AvisController::class, 'laisserAvis']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'getUnread']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Nouvelles routes de modération
    Route::post('/admin/users/{id}/toggle-admin', [AdminController::class, 'toggleAdmin']);
    Route::post('/admin/users/{id}/toggle-active', [AdminController::class, 'toggleActive']);
    Route::post('/admin/annonces/{id}/valider', [AdminController::class, 'validerAnnonce']);
    Route::post('/admin/decouvertes/{id}/valider', [AdminController::class, 'validerDecouverte']);

    Route::get('/admin/dashboard', [AdminController::class, 'getDashboardData']);
    Route::delete('/admin/annonces/{id}', [AdminController::class, 'deleteAnnonce']);
    Route::delete('/admin/decouvertes/{id}', [AdminController::class, 'deleteDecouverte']);
    Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);

    // Routes pour modifier des publications
    Route::post('/annonces/{id}/update', [AnnonceController::class, 'update']);
    Route::post('/decouvertes/{id}/update', [DecouverteController::class, 'update']);
});