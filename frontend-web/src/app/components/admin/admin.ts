import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminService } from '../../services/admin';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.html',
})
export class Admin implements OnInit {
  activeTab: string = 'dashboard';
  chargement: boolean = true;
  erreur: string = '';
  successMessage: string = '';

  dashboardData: any = {
    users: [],
    annonces: [],
    decouvertes: [],
    stats: { 
      total_users: 0, users_actifs: 0, users_suspendus: 0,
      total_annonces: 0, annonces_validees: 0, annonces_attente: 0,
      total_decouvertes: 0, decouvertes_validees: 0, decouvertes_attente: 0 
    }
  };

  selectedItem: any = null;
  selectedType: 'annonce' | 'decouverte' | null = null;

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit() {
    this.chargerDonnees();
  }

  chargerDonnees() {
    this.chargement = true;
    this.erreur = '';
    
    this.adminService.getDashboardData().subscribe({
      next: (res) => {
        this.chargement = false;
        if (res.success) {
          this.dashboardData = res.data;
        }
      },
      error: (err) => {
        this.chargement = false;
        if (err.status === 403) {
          this.erreur = "Accès refusé. Vous n'avez pas les droits d'administrateur.";
        } else {
          this.erreur = "Erreur de connexion au serveur.";
        }
      }
    });
  }

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  voirDetails(item: any, type: 'annonce' | 'decouverte') {
    let parsedItem = { ...item };
    if (parsedItem.images && typeof parsedItem.images === 'string') {
        try {
            parsedItem.parsedImages = JSON.parse(parsedItem.images);
        } catch (e) {
            parsedItem.parsedImages = null;
        }
    }
    this.selectedItem = parsedItem;
    this.selectedType = type;
  }

  fermerDetails() {
    this.selectedItem = null;
    this.selectedType = null;
  }

  getAllImages(): string[] {
    if (!this.selectedItem || !this.selectedItem.parsedImages) return [];
    if (this.selectedType === 'decouverte') return this.selectedItem.parsedImages;
    
    const all: string[] = [];
    for (const key in this.selectedItem.parsedImages) {
        if (Array.isArray(this.selectedItem.parsedImages[key])) {
            all.push(...this.selectedItem.parsedImages[key]);
        }
    }
    return all;
  }

  // --- ACTIONS DE MODÉRATION ---

  supprimerUser(id: number, nom: string) {
    if(confirm(`⚠️ ATTENTION : Voulez-vous vraiment bannir "${nom}" ?\nToutes ses annonces seront supprimées définitivement.`)) {
      this.adminService.deleteUser(id).subscribe({
        next: (res) => {
          this.afficherSucces(res.message);
          this.chargerDonnees();
        },
        error: (err) => this.erreur = err.error?.message || "Erreur lors de la suppression."
      });
    }
  }

  supprimerAnnonce(id: number) {
    if(confirm("Voulez-vous supprimer cette annonce immobilière de la plateforme ?")) {
      this.adminService.deleteAnnonce(id).subscribe({
        next: (res) => {
          this.afficherSucces(res.message);
          this.chargerDonnees();
        },
        error: (err) => this.erreur = "Erreur lors de la suppression de l'annonce."
      });
    }
  }

  supprimerDecouverte(id: number) {
    if(confirm("Voulez-vous retirer cet établissement de l'annuaire ?")) {
      this.adminService.deleteDecouverte(id).subscribe({
        next: (res) => {
          this.afficherSucces(res.message);
          this.chargerDonnees();
        },
        error: (err) => this.erreur = "Erreur lors de la suppression de l'établissement."
      });
    }
  }

  afficherSucces(msg: string) {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 4000);
  }

  // ... (tes anciennes fonctions supprimerUser, etc.)

  toggleAdminUser(id: number, nom: string) {
    if(confirm(`Voulez-vous modifier les droits d'administration pour ${nom} ?`)) {
      this.adminService.toggleAdmin(id).subscribe({
        next: (res) => { this.afficherSucces(res.message); this.chargerDonnees(); },
        error: (err) => this.erreur = err.error?.message || "Erreur de modification."
      });
    }
  }

  toggleActiveUser(id: number, nom: string) {
    if(confirm(`Voulez-vous changer le statut du compte de ${nom} ?`)) {
      this.adminService.toggleActive(id).subscribe({
        next: (res) => { this.afficherSucces(res.message); this.chargerDonnees(); },
        error: (err) => this.erreur = err.error?.message || "Erreur de modification."
      });
    }
  }

  approuverAnnonce(id: number) {
    if(confirm("Confirmez-vous la publication de cette annonce ?")) {
      this.adminService.validerAnnonce(id).subscribe({
        next: (res) => { 
            this.afficherSucces(res.message); 
            this.chargerDonnees(); 
            if(this.selectedItem && this.selectedItem.id === id) this.fermerDetails();
        },
        error: (err) => this.erreur = "Erreur lors de la validation."
      });
    }
  }

  approuverDecouverte(id: number) {
    if(confirm("Confirmez-vous la publication de cet établissement ?")) {
      this.adminService.validerDecouverte(id).subscribe({
        next: (res) => { 
            this.afficherSucces(res.message); 
            this.chargerDonnees(); 
            if(this.selectedItem && this.selectedItem.id === id) this.fermerDetails();
        },
        error: (err) => this.erreur = "Erreur lors de la validation."
      });
    }
  }
}