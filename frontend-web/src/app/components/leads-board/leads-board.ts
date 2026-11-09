import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LeadService, Lead } from '../../services/lead';
import { PaymentService, PaymentInitiation } from '../../services/payment';

@Component({
  selector: 'app-leads-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leads-board.html',
  styleUrls: ['./leads-board.css']
})
export class LeadsBoardComponent implements OnInit {
  leads: Lead[] = [];

  constructor(
    private leadService: LeadService,
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLeads();
  }

  loadLeads(): void {
    this.leadService.getLeads().subscribe({
      next: (data) => this.leads = data,
      error: (err) => console.error('Erreur lors du chargement des leads', err)
    });
  }

  acheterLead(lead: Lead): void {
    const token = localStorage.getItem('macaz_token');
    if (!token) {
      alert('Vous devez être connecté pour débloquer un contact.');
      this.router.navigate(['/auth']);
      return;
    }

    const paymentData: PaymentInitiation = {
      type: 'lead_purchase',
      amount: 1000, // 1000 FCFA
      reference_id: lead.id!
    };

    this.paymentService.initiatePayment(paymentData).subscribe({
      next: (res) => {
        // Rediriger vers l'URL de paiement ou ouvrir une modale
        console.log('Paiement initié', res);
        alert('Redirection vers la page de paiement : ' + res.payment_url);
      },
      error: (err) => {
        if (err.status === 401) {
          alert('Votre session a expiré. Veuillez vous reconnecter.');
          this.router.navigate(['/auth']);
        } else {
          alert('Erreur lors de l\'initiation du paiement');
        }
      }
    });
  }
}
