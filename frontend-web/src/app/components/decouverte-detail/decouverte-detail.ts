import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DecouverteService } from '../../services/decouverte';
import * as L from 'leaflet';

@Component({
  selector: 'app-decouverte-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './decouverte-detail.html',
})
export class DecouverteDetail implements OnInit, OnDestroy {
  decouverte: any = null;
  images: string[] = [];
  imagePrincipale: string = '';
  chargement = true;
  erreur = '';
  map: any;

  constructor(
    private route: ActivatedRoute,
    private decouverteService: DecouverteService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.chargerDetails(id);
    }
  }

  chargerDetails(id: string) {
    this.decouverteService.getDecouverteById(id).subscribe({
      next: (res) => {
        this.chargement = false;
        if (res.success) {
          this.decouverte = res.data;
          
          // Traitement des images
          try {
            this.images = this.decouverte.images ? JSON.parse(this.decouverte.images) : [];
          } catch (e) {
            this.images = [];
          }
          this.imagePrincipale = this.images.length > 0 ? this.images[0] : 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1000&q=80';

          // Initialisation de la carte après un court délai pour s'assurer que le HTML est rendu
          setTimeout(() => this.initMap(), 100);
        }
      },
      error: (err) => {
        this.chargement = false;
        this.erreur = "Impossible de charger les détails de cet établissement.";
      }
    });
  }

  changerImage(url: string) {
    this.imagePrincipale = url;
  }

  initMap() {
    // Configuration de l'icône Leaflet par défaut
    const iconDefault = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    // Création de la carte (Centrée sur Abidjan par défaut)
    this.map = L.map('map-lieu').setView([5.3599, -4.0083], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors, © CARTO'
    }).addTo(this.map);

    // Ajout d'un marqueur représentatif
    L.marker([5.3599, -4.0083], { icon: iconDefault })
      .addTo(this.map)
      .bindPopup(`<b>${this.decouverte.nom}</b><br>${this.decouverte.commune}`)
      .openPopup();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove(); // Nettoyage de la carte en quittant la page
    }
  }
}