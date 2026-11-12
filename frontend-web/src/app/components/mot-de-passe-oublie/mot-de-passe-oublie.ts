import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-mot-de-passe-oublie',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mot-de-passe-oublie.html',
})
export class MotDePasseOublie {
  emailEnvoye = false;
  email = '';
  chargement = false;
  erreur = '';

  constructor(private auth: AuthService) {}

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.chargement || !this.email.trim()) return;
    this.chargement = true;
    this.erreur = '';
    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: () => {
        this.emailEnvoye = true;
        this.chargement = false;
      },
      error: (err) => {
        this.chargement = false;
        this.erreur = err.status === 429
          ? 'Trop de demandes. Patientez avant de reessayer.'
          : err.status === 0 ? 'Connexion au serveur impossible.'
          : err.error?.message || 'Impossible d’envoyer le lien. Réessayez plus tard.';
      }
    });
  }
}
