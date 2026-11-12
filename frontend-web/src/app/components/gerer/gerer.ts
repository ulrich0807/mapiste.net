import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // <-- Ajout de Router
import { FormsModule } from '@angular/forms';
import { AnnonceService } from '../../services/annonce';
import { DecouverteService } from '../../services/decouverte';
import { AuthService } from '../../services/auth';
import { VisiteService } from '../../services/visite';
import { PaymentService, PaymentInitiation } from '../../services/payment';

@Component({
  selector: 'app-gerer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './gerer.html',
})
export class Gerer implements OnInit {
  utilisateur: any = null;
  ongletActif: string = 'annonces';
  chargement = true;
  erreurMessage = '';
  successMessage = '';

  // --- Donn�es Immobilier ---
  annonces: any[] = [];

  // --- Donn�es Annuaire (D�couvertes) ---
  decouvertes: any[] = [];
  afficherFormulaireLieu = false;
  chargementFormulaire = false;

  // --- Donn�es Visites ---
  demandesVisites: any[] = [];
  mesVisites: any[] = [];
  
  // VARIABLES POUR LE MODE �DITION (Annuaire)
  modeEditionLieu = false;
  idLieuEnEdition: number | null = null;
  
  // Mod�le du formulaire
  nouveauLieu = {
    nom: '',
    categorie: 'restaurant',
    commune: '',
    telephone: '',
    description: ''
  };
  fichiersLieu: File[] = [];
  previewsLieu: string[] = [];

  constructor(
    private annonceService: AnnonceService,
    private decouverteService: DecouverteService,
    private authService: AuthService,
    private visiteService: VisiteService,
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.utilisateur = user;
    });
    this.chargerMesAnnonces();
    this.chargerMesDecouvertes();
  }

  changerOnglet(onglet: string) {
    this.ongletActif = onglet;
    this.erreurMessage = '';
    this.successMessage = '';
    this.annulerEditionLieu();
    
    if (onglet === 'visites' && (this.demandesVisites.length === 0 || this.mesVisites.length === 0)) {
      this.chargerVisites();
    }
  }

  // ==========================================
  // SECTION VISITES
  // ==========================================
  chargerVisites() {
    this.chargement = true;
    this.visiteService.getDemandesRecues().subscribe({
      next: (res) => {
        if (res.success) this.demandesVisites = res.data;
      }
    });
    this.visiteService.getMesVisites().subscribe({
      next: (res) => {
        this.chargement = false;
        if (res.success) this.mesVisites = res.data;
      }
    });
  }

  changerStatutVisite(id: number, statut: 'validee' | 'annulee' | 'terminee') {
    this.visiteService.changerStatut(id, statut).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage = 'Statut mis � jour avec succ�s.';
          this.chargerVisites(); // Recharger les donn�es
          setTimeout(() => this.successMessage = '', 3000);
        }
      }
    });
  }

  // ==========================================
  // SECTION IMMOBILIER
  // ==========================================
  chargerMesAnnonces() {
    this.chargement = true;
    this.annonceService.getMesAnnonces().subscribe({
      next: (res) => {
        this.chargement = false;
        if (res.success) {
          this.annonces = res.data.map((item: any) => {
            try { item.parsedImages = item.images ? JSON.parse(item.images) : {}; }
            catch (e) { item.parsedImages = {}; }
            return item;
          });
        }
      }
    });
  }

  getPremiereImageAnnonce(parsedImages: any): string {
    const categories = ['salon', 'chambre', 'cuisine', 'salle_de_bain', 'exterieur'];
    for (const cat of categories) {
      if (parsedImages && parsedImages[cat] && parsedImages[cat].length > 0) {
        return parsedImages[cat][0];
      }
    }
    return 'assets/placeholder-image.jpg';
  }

  // NOUVEAU : Redirection vers la page vendre avec l'ID
  modifierAnnonce(id: number) {
    this.router.navigate(['/vendre'], { queryParams: { id: id } });
  }

  supprimerAnnonce(id: number) {
    if (confirm('Voulez-vous vraiment supprimer cette annonce immobili�re ?')) {
      this.annonceService.supprimerAnnonce(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.successMessage = 'Annonce supprim�e avec succ�s.';
            this.chargerMesAnnonces();
            setTimeout(() => this.successMessage = '', 3000);
          }
        }
      });
    }
  }

  boosterAnnonce(id: number) {
    if (confirm("�tes-vous s�r de vouloir mettre cette annonce � la une pour 5000 FCFA ?")) {
      const paymentData: PaymentInitiation = {
        type: 'boost',
        amount: 5000,
        reference_id: id
      };
      
      this.paymentService.initiatePayment(paymentData).subscribe({
        next: (res: any) => {
          alert('Redirection vers la page de paiement : ' + res.payment_url);
        },
        error: (err) => {
          this.erreurMessage = err.error?.message || "Erreur lors de l'initiation du paiement.";
          setTimeout(() => this.erreurMessage = '', 3000);
        }
      });
    }
  }

  // ==========================================
  // SECTION D�COUVERTE (ANNUAIRE)
  // ==========================================
  chargerMesDecouvertes() {
    this.decouverteService.getMesDecouvertes().subscribe({
      next: (res) => {
        if (res.success) {
          this.decouvertes = res.data.map((item: any) => {
            try { item.parsedImages = item.images ? JSON.parse(item.images) : []; }
            catch (e) { item.parsedImages = []; }
            return item;
          });
        }
      }
    });
  }

  getPremiereImageDecouverte(images: string[]): string {
    return (images && images.length > 0) ? images[0] : 'assets/placeholder-image.jpg';
  }

  supprimerDecouverte(id: number) {
    if (confirm('Voulez-vous vraiment supprimer cet �tablissement ?')) {
      this.decouverteService.supprimerDecouverte(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.successMessage = '�tablissement supprim� avec succ�s.';
            this.chargerMesDecouvertes();
            setTimeout(() => this.successMessage = '', 3000);
          }
        }
      });
    }
  }

  // --- Gestion du Formulaire (Ajout & �dition) ---
  
  // NOUVEAU : Pr�-remplir le formulaire pour la modification
  modifierDecouverte(item: any) {
    this.modeEditionLieu = true;
    this.idLieuEnEdition = item.id;
    this.nouveauLieu = {
      nom: item.nom,
      categorie: item.categorie,
      commune: item.commune,
      telephone: item.telephone,
      description: item.description
    };
    this.fichiersLieu = [];
    this.previewsLieu = []; // Note: On pourrait aussi charger les anciennes images ici
    this.afficherFormulaireLieu = true;
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Remonte en haut de la page
  }

  annulerEditionLieu() {
    this.afficherFormulaireLieu = false;
    this.modeEditionLieu = false;
    this.idLieuEnEdition = null;
    this.nouveauLieu = { nom: '', categorie: 'restaurant', commune: '', telephone: '', description: '' };
    this.fichiersLieu = [];
    this.previewsLieu = [];
  }

  onFileSelectedLieu(event: any) {
    const files: FileList = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.fichiersLieu.push(file);
        
        const reader = new FileReader();
        reader.onload = (e: any) => this.previewsLieu.push(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  }

  retirerPhotoLieu(index: number) {
    this.previewsLieu.splice(index, 1);
    this.fichiersLieu.splice(index, 1);
  }

  soumettreLieu(event: Event) {
    event.preventDefault();
    this.chargementFormulaire = true;
    this.erreurMessage = '';

    const formData = new FormData();
    formData.append('nom', this.nouveauLieu.nom);
    formData.append('categorie', this.nouveauLieu.categorie);
    formData.append('commune', this.nouveauLieu.commune);
    formData.append('telephone', this.nouveauLieu.telephone);
    formData.append('description', this.nouveauLieu.description);
    
    this.fichiersLieu.forEach(file => {
      formData.append('images[]', file);
    });

    // On v�rifie si on est en mode cr�ation ou �dition
    const requete$ = this.modeEditionLieu && this.idLieuEnEdition 
      ? this.decouverteService.updateDecouverte(this.idLieuEnEdition, formData)
      : this.decouverteService.creerDecouverte(formData);

    requete$.subscribe({
      next: (res: any) => {
        this.chargementFormulaire = false;
        if (res.success) {
          this.successMessage = this.modeEditionLieu ? 'Fiche modifi�e avec succ�s !' : 'Fiche cr��e avec succ�s !';
          this.annulerEditionLieu();
          this.chargerMesDecouvertes(); // Rafra�chir la liste
          setTimeout(() => this.successMessage = '', 3000);
        } else {
          this.erreurMessage = res.message;
        }
      },
      error: (err: any) => {
        this.chargementFormulaire = false;
        this.erreurMessage = 'Erreur lors de l\'enregistrement.';
      }
    });
  }
}
