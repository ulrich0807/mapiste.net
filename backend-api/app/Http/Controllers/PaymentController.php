<?php

namespace App\Http\Controllers;

class PaymentController extends Controller
{
    public function initiatePayment()
    {
        return $this->unavailable();
    }

    public function paymentCallback()
    {
        // Aucun avantage avant verification du paiement par un prestataire reel.
        return $this->unavailable();
    }

    private function unavailable()
    {
        return response()->json([
            'success' => false,
            'message' => 'Les paiements ne sont pas encore disponibles.',
        ], 503);
    }
}