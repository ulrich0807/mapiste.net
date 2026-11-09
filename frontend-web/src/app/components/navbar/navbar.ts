import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
})
export class Navbar implements OnInit {
  utilisateurConnecte: any = null;
  isMobileMenuOpen: boolean = false; 
  isNotificationMenuOpen: boolean = false;
  private pollingInterval: any;

  constructor(
    private authService: AuthService, 
    private router: Router,
    public notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.utilisateurConnecte = user;
      
      if (user) {
        // Au chargement initial
        this.notificationService.fetchUnread().subscribe();
        
        // Polling toutes les 30 secondes pour simuler le temps réel
        this.pollingInterval = setInterval(() => {
          this.notificationService.fetchUnread().subscribe();
        }, 30000);
      } else {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
      }
    });
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  seDeconnecter() {
    this.authService.logout();
    this.router.navigate(['/']); 
  }

  // LA CORRECTION EST ICI : Le nom correspond exactement au fichier HTML
  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.isNotificationMenuOpen = false;
  }

  toggleNotificationMenu() {
    this.isNotificationMenuOpen = !this.isNotificationMenuOpen;
  }

  markNotificationAsRead(notif: any) {
    this.notificationService.markAsRead(notif.id).subscribe(() => {
      this.isNotificationMenuOpen = false;
      if (notif.data.url) {
        this.router.navigateByUrl(notif.data.url);
      }
    });
  }
}