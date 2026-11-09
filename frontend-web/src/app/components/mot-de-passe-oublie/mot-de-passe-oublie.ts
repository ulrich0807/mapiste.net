import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mot-de-passe-oublie',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mot-de-passe-oublie.html',
})
export class MotDePasseOublie {
  emailEnvoye = false;

  onSubmit(event: Event) {
    event.preventDefault();
    // Plus tard, nous ferons l'appel API vers Laravel pour envoyer le mail de réinitialisation
    this.emailEnvoye = true;
  }
}