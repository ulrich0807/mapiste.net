import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // <-- Import du Router
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth'; // <-- L'import qui règle ton erreur !

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './auth.html',
})
export class Auth {
  isLoginMode = true;
  isOtpMode = false;
  chargement = false;
  erreurMessage = '';
  successMessage = '';

  // Modèles de données pour le formulaire
  nomComplet = '';
  email = '';
  motDePasse = '';
  otpCode = '';

  // Maintenant Angular sait exactement ce que sont AuthService et Router
  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.erreurMessage = '';
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.chargement = true;
    this.erreurMessage = '';

    if (this.isLoginMode) {
      // Connexion
      this.authService.login({ email: this.email, password: this.motDePasse }).subscribe({
        next: (res) => {
          this.chargement = false;
          if (res.success) this.router.navigate(['/']);
        },
        error: (err) => {
          this.chargement = false;
          if (err.error?.message === 'OTP_REQUIRED') {
            this.isOtpMode = true;
            this.successMessage = 'Veuillez vérifier votre email pour le code de validation.';
          } else {
            this.erreurMessage = err.error?.message || 'Identifiants incorrects ou problème serveur.';
          }
        }
      });
    } else {
      // Inscription
      this.authService.register({ name: this.nomComplet, email: this.email, password: this.motDePasse }).subscribe({
        next: (res) => {
          this.chargement = false;
          if (res.message === 'OTP_REQUIRED') {
            this.isOtpMode = true;
            this.successMessage = 'Compte créé ! Veuillez vérifier votre email pour le code de validation.';
          } else if (res.success) {
            this.router.navigate(['/']);
          }
        },
        error: (err) => {
          this.chargement = false;
          this.erreurMessage = err.error?.message || 'Erreur lors de la création du compte.';
        }
      });
    }
  }

  verifyOtp(event: Event) {
    event.preventDefault();
    this.chargement = true;
    this.erreurMessage = '';
    this.successMessage = '';

    this.authService.verifyOtp({ email: this.email, otp_code: this.otpCode }).subscribe({
      next: (res) => {
        this.chargement = false;
        if (res.success) {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.chargement = false;
        this.erreurMessage = err.error?.message || 'Code invalide.';
      }
    });
  }

  resendOtp() {
    this.chargement = true;
    this.erreurMessage = '';
    this.successMessage = '';

    this.authService.resendOtp({ email: this.email }).subscribe({
      next: (res) => {
        this.chargement = false;
        if (res.success) {
          this.successMessage = res.message;
        }
      },
      error: (err) => {
        this.chargement = false;
        this.erreurMessage = err.error?.message || 'Erreur lors de l\'envoi du code.';
      }
    });
  }
}