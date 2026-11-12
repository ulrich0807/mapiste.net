import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentService, PaymentInitiation } from '../../services/payment';

@Component({
  selector: 'app-subscription-plans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-plans.html',
  styleUrls: ['./subscription-plans.css']
})
export class SubscriptionPlansComponent {
  plans = [
    { name: 'Formule 1', price: 15000, desc: 'Petites agences', features: ['8 annonces', 'Photos & descriptions', 'Coordonnées agence'] },
    { name: 'Formule 2', price: 25000, desc: 'Moyennes agences', features: ['15 annonces', 'Profil optimisé', 'Présence prioritaire'] },
    { name: 'Formule 3', price: 50000, desc: 'Grandes agences', features: ['Annonces illimitées', 'Positionnement prioritaire', 'Réseaux sociaux'] }
  ];

  constructor(private paymentService: PaymentService, private router: Router) {}

  souscrire(plan: any): void {
    const token = localStorage.getItem('macaz_token');
    if (!token) {
      alert('Vous devez être connecté pour souscrire à une offre.');
      this.router.navigate(['/auth']);
      return;
    }

    const paymentData: PaymentInitiation = {
      type: 'subscription',
      amount: plan.price,
      reference_id: 1 // Id de l'agence ou de l'abonnement
    };
    // hack: we should pass plan_name too, maybe add it to PaymentInitiation later
    this.paymentService.initiatePayment(paymentData).subscribe({
      next: (res) => {
        alert('Redirection vers le paiement pour ' + plan.name + ' : ' + res.payment_url);
      },
      error: (err) => {
        if (err.status === 401) {
          alert('Votre session a expiré. Veuillez vous reconnecter.');
          this.router.navigate(['/auth']);
        } else {
          alert(err.error?.message || 'Une erreur est survenue lors du paiement.');
        }
      }
    });
  }
}
