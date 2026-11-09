import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { ChatWidget } from './components/chat-widget/chat-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, ChatWidget, CommonModule],
  templateUrl: './app.html',
})
export class App implements OnInit {
  title = 'Macaz';
  deferredPrompt: any;
  showInstallBanner = false;

  ngOnInit() {
    // Vérifier si l'app est déjà installée (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.showInstallBanner = false;
    }
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onbeforeinstallprompt(e: Event) {
    // Empêcher l'affichage automatique du prompt par le navigateur
    e.preventDefault();
    // Sauvegarder l'événement pour le déclencher plus tard
    this.deferredPrompt = e;
    this.showInstallBanner = true;
  }

  installerPWA() {
    this.showInstallBanner = false;
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Utilisateur a accepté l\'installation PWA');
        } else {
          console.log('Utilisateur a refusé l\'installation PWA');
        }
        this.deferredPrompt = null;
      });
    }
  }

  fermerBanner() {
    this.showInstallBanner = false;
  }
}