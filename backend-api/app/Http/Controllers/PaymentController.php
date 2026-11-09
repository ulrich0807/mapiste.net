<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Annonce;
use App\Models\Subscription;
use App\Models\LeadPurchase;
use App\Models\Transaction;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PaymentController extends Controller
{
    // Simule l'initiation d'un paiement et retourne une URL/token
    public function initiatePayment(Request $request)
    {
        $request->validate([
            'type' => 'required|in:boost,subscription,lead_purchase',
            'amount' => 'required|numeric',
            'reference_id' => 'required|integer', // L'id de l'annonce, du plan, ou du lead
        ]);

        $transaction = Transaction::create([
            'user_id' => $request->user()->id,
            'type' => $request->type,
            'amount' => $request->amount,
            'currency' => 'XOF',
            'status' => 'pending',
            'reference' => 'PAY-' . Str::upper(Str::random(10)),
        ]);

        // Ici, appel réel à l'API de paiement (ex: CinetPay)
        // Pour l'instant, on simule une réponse de l'API
        return response()->json([
            'message' => 'Paiement initié',
            'transaction_id' => $transaction->id,
            'payment_url' => 'https://sandbox.paiement.test/pay/' . $transaction->reference
        ]);
    }

    // Webhook appelé par le fournisseur de paiement
    public function paymentCallback(Request $request)
    {
        // En vrai: vérifier la signature du webhook
        
        $transaction = Transaction::where('reference', $request->reference)->firstOrFail();

        if ($request->status === 'success' && $transaction->status === 'pending') {
            $transaction->update(['status' => 'success']);

            // Traitement selon le type
            if ($transaction->type === 'boost') {
                $annonce = Annonce::findOrFail($request->reference_id); // Dans la vraie vie, passer reference_id dans les metadata du paiement
                $annonce->update([
                    'is_premium' => true,
                    'boosted_until' => Carbon::now()->addDays($request->duration_days ?? 7) // Durée selon le montant
                ]);
            } 
            elseif ($transaction->type === 'subscription') {
                Subscription::create([
                    'user_id' => $transaction->user_id,
                    'plan_name' => $request->plan_name ?? 'Formule 1',
                    'starts_at' => Carbon::now(),
                    'ends_at' => Carbon::now()->addMonth(),
                    'is_active' => true
                ]);
            }
            elseif ($transaction->type === 'lead_purchase') {
                LeadPurchase::create([
                    'lead_id' => $request->reference_id,
                    'professional_id' => $transaction->user_id,
                    'transaction_id' => $transaction->id,
                ]);
            }

            return response()->json(['message' => 'Transaction validée']);
        }

        $transaction->update(['status' => 'failed']);
        return response()->json(['message' => 'Transaction échouée'], 400);
    }
}
