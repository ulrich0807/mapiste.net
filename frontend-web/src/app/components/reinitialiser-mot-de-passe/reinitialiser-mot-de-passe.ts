import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-reinitialiser-mot-de-passe',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reinitialiser-mot-de-passe.html'
})
export class ReinitialiserMotDePasse {
  email: string;
  private token: string;
  password = '';
  confirmation = '';
  chargement = false;
  termine = false;
  erreur = '';

  constructor(route: ActivatedRoute, private auth: AuthService) {
    this.email = route.snapshot.queryParamMap.get('email') || '';
    this.token = route.snapshot.queryParamMap.get('token') || '';
    if (!this.email || !this.token) this.erreur = 'Ce lien est incomplet. Demandez un nouveau lien.';
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.chargement) return;
    if (!this.token || !this.email) {
      this.erreur = 'Ce lien est incomplet. Demandez un nouveau lien.';
      return;
    }
    if (this.password.length < 8 || this.password !== this.confirmation) {
      this.erreur = 'Utilisez au moins 8 caracteres et deux mots de passe identiques.';
      return;
    }
    this.erreur = '';
    this.chargement = true;
    this.auth.resetPassword({
      email: this.email, token: this.token,
      password: this.password, password_confirmation: this.confirmation
    }).subscribe({
      next: () => {
        this.chargement = false;
        this.termine = true;
        this.password = this.confirmation = '';
        // Retirer le jeton de l'historique courant apres utilisation.
        window.history.replaceState(null, '', window.location.pathname);
      },
      error: (err) => {
        this.chargement = false;
        this.erreur = err.status === 429 ? 'Trop de tentatives. Reessayez plus tard.'
          : err.status === 0 ? 'Connexion au serveur impossible.'
          : err.error?.message || 'Ce lien est invalide ou expire. Demandez un nouveau lien.';
      }
    });
  }
}
