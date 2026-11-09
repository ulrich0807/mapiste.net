import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnnonceService } from '../../services/annonce';

@Component({
  selector: 'app-louer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './louer.html',
})
export class Louer implements OnInit {
  annonces: any[] = [];
  chargement = true;
  chargementMore = false;
  page: number = 1;
  hasMore: boolean = false;

  // États des filtres liés avec ngModel
  communeFiltre: string = '';
  prixMaxFiltre: number | null = null;
  piecesFiltre: string = 'Tous';
  typeRecherche: string = 'location';

  constructor(
    private annonceService: AnnonceService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['lieu']) this.communeFiltre = params['lieu'];
      if (params['prix']) this.prixMaxFiltre = +params['prix'];
      if (params['pieces']) this.piecesFiltre = params['pieces'];
      
      if (params['type']) {
        if (params['type'] === 'achetez') this.typeRecherche = 'vente';
        else if (params['type'] === 'meuble') this.typeRecherche = 'meuble';
        else this.typeRecherche = 'location';
      }

      this.chargerAnnonces(true);
    });
  }

  chargerAnnonces(reset: boolean = false) {
    if (reset) {
      this.page = 1;
      this.chargement = true;
      this.annonces = [];
    } else {
      this.chargementMore = true;
    }
    
    const filtresAPI: any = {
      type: this.typeRecherche === 'location' ? 'louez' : (this.typeRecherche === 'vente' ? 'achetez' : 'meuble')
    };

    if (this.communeFiltre) filtresAPI.lieu = this.communeFiltre;
    if (this.prixMaxFiltre) filtresAPI.prix = this.prixMaxFiltre;
    if (this.piecesFiltre && this.piecesFiltre !== 'Tous') {
      // Backend expects text search for pieces
      filtresAPI.pieces = this.piecesFiltre + ' pièce'; 
    }

    this.annonceService.getAnnonces(filtresAPI, this.page).subscribe({
      next: (reponse: any) => {
        this.chargement = false;
        this.chargementMore = false;
        if (reponse.success) {
          const paginationData = reponse.data;
          const items = Array.isArray(paginationData) ? paginationData : paginationData.data;
          
          const annoncesTraitees = items.map((item: any) => {
            if (item.images) {
              try {
                item.parsedImages = JSON.parse(item.images);
              } catch (e) {
                item.parsedImages = {};
              }
            }
            return item;
          });
          
          if (reset) {
            this.annonces = annoncesTraitees;
          } else {
            this.annonces = [...this.annonces, ...annoncesTraitees];
          }

          if (!Array.isArray(paginationData)) {
             this.hasMore = paginationData.current_page < paginationData.last_page;
          } else {
             this.hasMore = false;
          }
        }
      },
      error: (err) => {
        this.chargement = false;
        this.chargementMore = false;
        console.error('Erreur de chargement:', err);
      }
    });
  }

  loadMore() {
    if (this.hasMore && !this.chargementMore) {
      this.page++;
      this.chargerAnnonces(false);
    }
  }

  appliquerFiltres() {
    this.chargerAnnonces(true);
  }

  getPremiereImage(parsedImages: any): string {
    if (!parsedImages) return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80';
    const categories = ['salon', 'chambre', 'cuisine', 'salle_de_bain', 'exterieur'];
    for (const cat of categories) {
      if (parsedImages[cat] && parsedImages[cat].length > 0) {
        return parsedImages[cat][0];
      }
    }
    return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80';
  }
}