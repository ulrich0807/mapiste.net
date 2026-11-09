import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnnonceService } from '../../services/annonce';
import { AuthService } from '../../services/auth';
import { VisiteService } from '../../services/visite';
import { MessagerieService } from '../../services/messagerie';
import { AvisService } from '../../services/avis';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-annonce-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './annonce-detail.html',
})
export class AnnonceDetail implements OnInit {
  annonce: any = null;
  chargement = true;
  erreur = '';
  isLoggedIn = false;
  isFavori = false; // Note: L'API devrait idéalement renvoyer ce statut

  // Gestion de la galerie
  imagesStructure: any = {};
  categoriesDisponibles: string[] = [];
  categorieActive: string = '';
  imagePrincipale: string = '';

  // Modals
  showVisiteModal = false;
  visiteDate = '';
  visiteMessage = '';
  
  showMessageModal = false;
  messageContent = '';

  // Avis
  avisList: any[] = [];
  chargementAvis = false;
  nouvelleNote: number = 5;
  nouveauCommentaire: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private annonceService: AnnonceService,
    private authService: AuthService,
    private visiteService: VisiteService,
    private messagerieService: MessagerieService,
    private avisService: AvisService
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.chargerAnnonce(id);
      this.chargerAvis(id);
    }
  }

  chargerAnnonce(id: string) {
    this.annonceService.getAnnonceById(id).subscribe({
      next: (res) => {
        this.chargement = false;
        if (res.success) {
          this.annonce = res.data;
          this.traiterImages();
        }
      },
      error: (err) => {
        this.chargement = false;
        this.erreur = 'Impossible de charger les détails de ce bien.';
      }
    });
  }

  traiterImages() {
    if (this.annonce.images) {
      try {
        this.imagesStructure = JSON.parse(this.annonce.images);
        this.categoriesDisponibles = Object.keys(this.imagesStructure).filter(
          cat => this.imagesStructure[cat] && this.imagesStructure[cat].length > 0
        );
        if (this.categoriesDisponibles.length > 0) {
          this.changerCategorie(this.categoriesDisponibles[0]);
        }
      } catch (e) {
        this.imagesStructure = {};
      }
    }
  }

  changerCategorie(cat: string) {
    this.categorieActive = cat;
    if (this.imagesStructure[cat] && this.imagesStructure[cat].length > 0) {
      this.imagePrincipale = this.imagesStructure[cat][0];
    }
  }

  changerImagePrincipale(url: string) {
    this.imagePrincipale = url;
  }

  getNomCategorie(code: string): string {
    const noms: any = {
      salon: 'Salon & Séjour',
      chambre: 'Chambres',
      cuisine: 'Cuisine',
      salle_de_bain: 'Salles de bain',
      exterieur: 'Extérieur'
    };
    return noms[code] || code;
  }

  // --- ACTIONS (MVP) ---

  toggleFavori() {
    if (!this.isLoggedIn) {
      this.router.navigate(['/auth']);
      return;
    }
    this.annonceService.toggleFavori(this.annonce.id).subscribe(res => {
      if (res.success) {
        this.isFavori = res.is_favori;
      }
    });
  }

  // MODAL VISITE
  openVisiteModal() {
    if (!this.isLoggedIn) { this.router.navigate(['/auth']); return; }
    this.showVisiteModal = true;
  }

  confirmerVisite() {
    if (!this.visiteDate) return;
    this.visiteService.programmerVisite(this.annonce.id, this.visiteDate, this.visiteMessage).subscribe(res => {
      if (res.success) {
        Swal.fire('Visite programmée', 'Votre demande a été envoyée avec succès ! Consultez votre profil pour le suivi.', 'success');
        this.showVisiteModal = false;
        this.visiteDate = '';
        this.visiteMessage = '';
      }
    });
  }

  // MODAL MESSAGE
  openMessageModal() {
    if (!this.isLoggedIn) { this.router.navigate(['/auth']); return; }
    this.showMessageModal = true;
  }

  envoyerMessage() {
    if (!this.messageContent.trim()) return;
    this.messagerieService.sendMessage(this.annonce.user_id, this.messageContent, this.annonce.id).subscribe(res => {
      if (res.success) {
        Swal.fire('Message envoyé', 'Votre message a été envoyé avec succès ! Redirection vers la messagerie...', 'success').then(() => {
          this.showMessageModal = false;
          this.router.navigate(['/messagerie']);
        });
      }
    });
  }

  // --- AVIS ---
  chargerAvis(id: string) {
    this.chargementAvis = true;
    this.avisService.getAvisAnnonce(Number(id)).subscribe({
      next: (res) => {
        this.chargementAvis = false;
        if (res.success) {
          this.avisList = res.data;
        }
      },
      error: (err) => {
        this.chargementAvis = false;
        console.error("Erreur chargement avis", err);
      }
    });
  }

  setNote(note: number) {
    this.nouvelleNote = note;
  }

  soumettreAvis() {
    if (!this.isLoggedIn) {
      this.router.navigate(['/auth']);
      return;
    }
    
    this.avisService.laisserAvis(this.nouvelleNote, this.nouveauCommentaire, undefined, this.annonce.id).subscribe({
      next: (res) => {
        if (res.success) {
          Swal.fire('Merci !', 'Votre avis a été publié avec succès.', 'success');
          this.nouveauCommentaire = '';
          this.nouvelleNote = 5;
          this.chargerAvis(this.annonce.id);
        }
      },
      error: (err) => {
        Swal.fire('Erreur', err.error?.message || 'Impossible de publier l\'avis.', 'error');
      }
    });
  }
}