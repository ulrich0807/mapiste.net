import { Component, OnInit, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms'; 
import * as L from 'leaflet';
import { AnnonceService } from '../../services/annonce';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './map-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapView implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // --- VARIABLES DU FORMULAIRE ---
  critereLieu: string = '';
  criterePieces: string = '';
  criterePrix: string = '';
  critereDateEntree: string = '';
  critereDateSortie: string = '';

  // --- FILTRES AVANCÉS ---
  showAdvancedFilters: boolean = false;
  amenities: { [key: string]: boolean } = {
    eau: false,
    electricite: false,
    ecoles: false,
    transports: false,
    travail: false
  };

  // --- VARIABLES DE LA CARTE ---
  private map: any;
  private coordonneesCommunes: any = {
    'Cocody': [5.3453, -3.9873],
    'Yopougon': [5.3283, -4.0722],
    'Marcory': [5.2952, -3.9723],
    'Commerce': [7.6939, -5.0307],
  };

  toutesLesAnnonces: any[] = [];
  listeCommunes: any[] = [];
  selectedCommune: string | null = null;
  annoncesFiltrees: any[] = [];
  activeTab: string = 'louez';
  
  // STATISTIQUES (Remplacées par les vraies données plus bas)
  stats: any = { en_location: 0, en_vente: 0, vendeurs: 0, visiteurs: 0 };

  // --- VARIABLES DU SLIDER ---
  sliderImages: string[] = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1531971589569-0d9370cbe1e5?q=80&w=1181&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1628745277862-bc0b2d68c50c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ];
  currentSlide = 0;
  slideInterval: any;

  // --- NOUVELLES VARIABLES POUR L'ACCUEIL DYNAMIQUE ---
  annoncesRecentes: any[] = [];
  decouvertesRecentes: any[] = [];
  statistiquesReelles: any = { total_biens: 0, total_artisans: 0, total_villes: 0, total_users: 0 };
  chargementAccueil = true;

  constructor(
    private annonceService: AnnonceService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initMap();
    this.chargerDonneesCarte(); // Charge les annonces pour la carte
    this.chargerDonneesAccueil(); // Charge les nouveautés et les stats
    this.startSlider();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==========================================
  // LOGIQUE DES NOUVELLES DONNÉES DYNAMIQUES
  // ==========================================
  chargerDonneesAccueil() {
    this.annonceService.getHomeData().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => {
        this.chargementAccueil = false;
        if (res.success) {
          // Mise à jour des stats avec les vraies données de la base
          this.statistiquesReelles = res.data.statistiques;
          
          // Décodage des images pour les annonces récentes
          this.annoncesRecentes = res.data.annonces.map((item: any) => {
            try { item.parsedImages = item.images ? JSON.parse(item.images) : {}; } 
            catch (e) { item.parsedImages = {}; }
            item.premiereImage = this.getPremiereImageAnnonce(item.parsedImages);
            return item;
          });

          // Décodage des images pour l'annuaire récent
          this.decouvertesRecentes = res.data.decouvertes.map((item: any) => {
            try { item.parsedImages = item.images ? JSON.parse(item.images) : []; } 
            catch (e) { item.parsedImages = []; }
            item.premiereImage = this.getPremiereImageDecouverte(item.parsedImages);
            return item;
          });
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.chargementAccueil = false;
        console.error('Erreur chargement données accueil', err);
      }
    });
  }

  getPremiereImageAnnonce(parsedImages: any): string {
    const categories = ['salon', 'chambre', 'cuisine', 'salle_de_bain', 'exterieur'];
    for (const cat of categories) {
      if (parsedImages && parsedImages[cat] && parsedImages[cat].length > 0) return parsedImages[cat][0];
    }
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80';
  }

  getPremiereImageDecouverte(images: string[]): string {
    return (images && images.length > 0) ? images[0] : 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80';
  }

  // ==========================================
  // ANCIENNE LOGIQUE (INCHANGÉE)
  // ==========================================
  lancerRecherche() {
    const queryParams: any = {
      lieu: this.critereLieu,
      type: this.activeTab
    };
    if (this.activeTab === 'meuble') {
      queryParams.entree = this.critereDateEntree;
      queryParams.sortie = this.critereDateSortie;
    } else {
      queryParams.pieces = this.criterePieces;
      queryParams.prix = this.criterePrix;
    }

    const equipementsArray = Object.keys(this.amenities).filter(k => this.amenities[k]);
    if (equipementsArray.length > 0) {
      queryParams.filtres_avances = JSON.stringify(equipementsArray);
    }

    this.router.navigate(['/louer'], { queryParams });
  }

  startSlider() {
    this.slideInterval = setInterval(() => { this.nextSlide(); }, 5000);
  }
  nextSlide() { this.currentSlide = (this.currentSlide + 1) % this.sliderImages.length; }
  prevSlide() { this.currentSlide = (this.currentSlide - 1 + this.sliderImages.length) % this.sliderImages.length; }
  goToSlide(index: number) { this.currentSlide = index; }
  switchTab(tab: string) { this.activeTab = tab; }

  private initMap(): void {
    this.map = L.map('map', { zoomControl: false }).setView([7.539989, -5.547080], 6);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
    setTimeout(() => { this.map.invalidateSize(); }, 500);
  }

  private chargerDonneesCarte(): void {
    // On charge la page 1 juste pour avoir les stats et les communes
    this.annonceService.getAnnonces().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (reponse: any) => {
        if (reponse.success) {
          this.listeCommunes = reponse.communes;
          if (reponse.stats) this.stats = reponse.stats;

          reponse.communes.forEach((data: any) => {
            const nomCommune = data.commune ? data.commune.trim() : '';
            const coords = this.coordonneesCommunes[nomCommune];
            if (coords) {
              const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `
                  <div class="w-10 h-10 bg-white rounded-xl shadow-lg border-2 border-orange-400 flex items-center justify-center transform transition-all hover:scale-110 hover:-translate-y-1 cursor-pointer text-orange-500">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                  </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              });
              const marker = L.marker(coords, { icon: customIcon }).addTo(this.map);
              const tooltipHtml = `
                <div class="bg-white p-4 rounded-xl shadow-xl border border-gray-100 min-w-[200px]">
                  <h4 class="font-bold text-gray-900 text-sm m-0">${data.commune}</h4>
                  <p class="text-xs text-orange-500 font-bold m-0 mt-1">${data.total_logements} Logement(s)</p>
                </div>
              `;
              marker.bindTooltip(tooltipHtml, { direction: 'top', className: 'premium-tooltip', offset: [0, -20] });
              marker.on('click', () => { this.afficherTableauCommune(nomCommune); });
            }
          });
          this.cdr.detectChanges();
        }
      }
    });
  }

  chargementCommune = false;
  
  afficherTableauCommune(commune: string) {
    this.selectedCommune = commune;
    this.chargementCommune = true;
    this.annoncesFiltrees = [];
    this.cdr.detectChanges();
    
    this.annonceService.getAnnonces({ lieu: commune }, 1).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (reponse: any) => {
        this.chargementCommune = false;
        if (reponse.success) {
          const paginationData = reponse.data;
          const items = Array.isArray(paginationData) ? paginationData : paginationData.data;
          this.annoncesFiltrees = items;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.chargementCommune = false;
        this.cdr.detectChanges();
      }
    });
  }
}