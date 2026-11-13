import { Component, OnDestroy, OnInit } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DecouverteService } from '../../services/decouverte';

interface FicheDecouverte {
  id: number;
  nom: string;
  categorie: string;
  description: string;
  commune: string;
  telephone: string | null;
  images: string | null;
  parsedImages: string[];
}

@Component({
  selector: 'app-abidjan',
  standalone: true,
  imports: [KeyValuePipe, RouterModule, FormsModule],
  templateUrl: './abidjan.html',
  styleUrl: './abidjan.css',
})
export class Abidjan implements OnInit, OnDestroy {
  readonly categories: Partial<Record<string, { label: string; photo: string }>> = {
    restaurant: { label: 'Restaurants et maquis', photo: '1517248135467-4c7edcad34c4' },
    artisan: { label: 'Artisans et dépannage', photo: '1504148455328-c376907d081c' },
    service: { label: 'Services divers', photo: '1581578731548-c64695cc6952' },
  };

  decouvertes: FicheDecouverte[] = [];
  chargement = true;
  chargementMore = false;
  erreurChargement = false;
  hasMore = false;
  communeFiltre = '';
  categorieFiltre = 'Toutes';

  private page = 1;
  private filtresAppliques: { commune?: string; categorie?: string } = {};
  private requete?: Subscription;

  constructor(private decouverteService: DecouverteService) {}

  ngOnInit(): void {
    this.appliquerFiltres();
  }

  ngOnDestroy(): void {
    this.requete?.unsubscribe();
  }

  appliquerFiltres(): void {
    this.filtresAppliques = {
      commune: this.communeFiltre.trim(),
      categorie: this.categorieFiltre === 'Toutes' ? undefined : this.categorieFiltre,
    };
    this.chargerDecouvertes(1);
  }

  reinitialiserFiltres(): void {
    this.communeFiltre = '';
    this.categorieFiltre = 'Toutes';
    this.appliquerFiltres();
  }

  loadMore(): void {
    if (this.hasMore && !this.chargementMore) {
      this.chargerDecouvertes(this.page + 1);
    }
  }

  getPremiereImage(images: string[], categorie: string): string | undefined {
    const photo = this.categories[categorie]?.photo;
    return images[0] || (photo && `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=800&q=80`);
  }

  masquerImageIndisponible(event: Event): void {
    (event.target as HTMLImageElement).hidden = true;
  }

  private chargerDecouvertes(page: number): void {
    this.requete?.unsubscribe();
    this.chargement = page === 1;
    this.chargementMore = page > 1;
    this.erreurChargement = false;
    if (page === 1) {
      this.decouvertes = [];
      this.hasMore = false;
    }

    this.requete = this.decouverteService.getDecouvertes(this.filtresAppliques, page).subscribe({
      next: (res) => {
        this.chargement = false;
        this.chargementMore = false;
        if (!res.success) {
          this.erreurChargement = true;
          return;
        }

        const pagination = res.data;
        const items: FicheDecouverte[] = Array.isArray(pagination) ? pagination : pagination.data;
        this.decouvertes = [...this.decouvertes, ...items.map(item => ({
          ...item,
          parsedImages: this.lirePhotos(item.images),
        }))];
        this.page = page;
        this.hasMore = !Array.isArray(pagination) && pagination.current_page < pagination.last_page;
      },
      error: () => {
        this.chargement = false;
        this.chargementMore = false;
        this.erreurChargement = true;
      },
    });
  }

  private lirePhotos(images: string | null): string[] {
    try {
      const photos: unknown = JSON.parse(images || '[]');
      return Array.isArray(photos) ? photos.filter((photo): photo is string => typeof photo === 'string' && !!photo) : [];
    } catch {
      return [];
    }
  }
}
