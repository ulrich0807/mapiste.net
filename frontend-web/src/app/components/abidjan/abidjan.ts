import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecouverteService } from '../../services/decouverte';

@Component({
  selector: 'app-abidjan',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './abidjan.html',
})
export class Abidjan implements OnInit {
  decouvertes: any[] = [];
  chargement = true;
  chargementMore = false;
  page: number = 1;
  hasMore: boolean = false;

  // Filtres de recherche
  communeFiltre: string = '';
  categorieFiltre: string = 'Toutes';

  constructor(private decouverteService: DecouverteService) {}

  ngOnInit(): void {
    this.chargerDecouvertes(true);
  }

  chargerDecouvertes(reset: boolean = false) {
    if (reset) {
      this.page = 1;
      this.chargement = true;
      this.decouvertes = [];
    } else {
      this.chargementMore = true;
    }

    const filtresAPI: any = {};
    if (this.communeFiltre) filtresAPI.commune = this.communeFiltre;
    if (this.categorieFiltre && this.categorieFiltre !== 'Toutes') filtresAPI.categorie = this.categorieFiltre;

    this.decouverteService.getDecouvertes(filtresAPI, this.page).subscribe({
      next: (res) => {
        this.chargement = false;
        this.chargementMore = false;
        if (res.success) {
          const paginationData = res.data;
          const items = Array.isArray(paginationData) ? paginationData : paginationData.data;

          const decouvertesTraitees = items.map((item: any) => {
            if (item.images) {
              try {
                item.parsedImages = JSON.parse(item.images);
              } catch (e) {
                item.parsedImages = [];
              }
            } else {
              item.parsedImages = [];
            }
            return item;
          });
          
          if (reset) {
            this.decouvertes = decouvertesTraitees;
          } else {
            this.decouvertes = [...this.decouvertes, ...decouvertesTraitees];
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
        console.error('Erreur lors du chargement des découvertes', err);
      }
    });
  }

  loadMore() {
    if (this.hasMore && !this.chargementMore) {
      this.page++;
      this.chargerDecouvertes(false);
    }
  }

  getPremiereImage(images: string[]): string {
    return (images && images.length > 0) ? images[0] : 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80';
  }

  appliquerFiltres() {
    this.chargerDecouvertes(true);
  }
}