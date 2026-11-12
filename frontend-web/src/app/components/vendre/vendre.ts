import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- Très important pour ngModel
import { ActivatedRoute } from '@angular/router'; // <-- Pour lire ?id=27
import { AnnonceService } from '../../services/annonce';

interface CategoriePhoto {
  nom: string;
  code: string;
  files: File[];
  previews: string[];
  existingImages?: string[];
}

@Component({
  selector: 'app-vendre',
  standalone: true,
  imports: [CommonModule, FormsModule], // <-- Ajout de FormsModule
  templateUrl: './vendre.html',
})
export class Vendre implements OnInit, OnDestroy {
  formSoumis = false;
  chargement = false;
  erreurMessage = '';

  // --- GESTION DU MODE ÉDITION ---
  modeEdition = false;
  idEdition: number | null = null;
  chargementInitial = false; // Pour afficher un "Chargement..." au début
  private ville = 'Abidjan';

  // Modèle de données pour lier le HTML au TypeScript
  annonceData = {
    titre: '',
    prix: '',
    commune: '',
    type_contrat: '',
    description: ''
  };

  // Commodités et équipements avancés
  amenities: { [key: string]: boolean } = {
    eau: false,
    electricite: false,
    ecoles: false,
    transports: false,
    travail: false
  };

  categoriesPhotos: CategoriePhoto[] = [
    { nom: 'Salon & Séjour', code: 'salon', files: [], previews: [] },
    { nom: 'Chambres', code: 'chambre', files: [], previews: [] },
    { nom: 'Cuisine', code: 'cuisine', files: [], previews: [] },
    { nom: 'Salles de bain', code: 'salle_de_bain', files: [], previews: [] },
    { nom: 'Extérieur / Façade', code: 'exterieur', files: [], previews: [] }
  ];

  constructor(
    private annonceService: AnnonceService,
    private route: ActivatedRoute // <-- Injection pour lire l'URL
  ) {}

  ngOnInit() {
    // 1. On écoute l'URL pour voir si on est en modification
    this.route.queryParams.subscribe((params: any) => {
      if (params['id']) {
        this.modeEdition = true;
        this.idEdition = params['id'];
        this.chargerDonneesAnnonce(this.idEdition!);
      }
    });
  }

  ngOnDestroy() {
    this.categoriesPhotos.forEach(cat => cat.previews.forEach(url => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    }));
  }

  // 2. On récupère les données et on pré-remplit le formulaire
  chargerDonneesAnnonce(id: number) {
    this.chargementInitial = true;
    this.annonceService.getAnnonce(id).subscribe({
      next: (res: any) => {
        this.chargementInitial = false;
        if (res.success) {
          const data = res.data;
          this.ville = data.ville || 'Abidjan';
          this.annonceData = {
            titre: data.titre,
            prix: data.prix,
            commune: data.commune,
            type_contrat: data.type_contrat,
            description: data.description
          };

          if (data.equipements && Array.isArray(data.equipements)) {
            data.equipements.forEach((eq: string) => {
              if (this.amenities[eq] !== undefined) {
                this.amenities[eq] = true;
              }
            });
          }

          // On essaie de précharger les anciennes images
          if (data.images) {
            try {
              const parsedImages = JSON.parse(data.images);
              this.categoriesPhotos.forEach(cat => {
                if (parsedImages[cat.code] && Array.isArray(parsedImages[cat.code])) {
                  cat.existingImages = [...parsedImages[cat.code]];
                  cat.previews = [...parsedImages[cat.code]];
                }
              });
            } catch (e) {
              console.error("Erreur parsing images:", e);
            }
          }
        }
      },
      error: (err: any) => {
        this.chargementInitial = false;
        this.erreurMessage = "Erreur lors du chargement des données de l'annonce.";
      }
    });
  }

  onFileSelected(event: any, codeCategorie: string) {
    const files: FileList = event.target.files;
    const categorie = this.categoriesPhotos.find(c => c.code === codeCategorie);

    if (files && categorie) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        categorie.files.push(file);
        
        categorie.previews.push(URL.createObjectURL(file));
      }
    }
  }

  retirerPhoto(codeCategorie: string, index: number) {
    const categorie = this.categoriesPhotos.find(c => c.code === codeCategorie);
    if (categorie) {
      const existingCount = categorie.existingImages?.length ?? 0;
      if (index < existingCount) {
        categorie.existingImages!.splice(index, 1);
      } else {
        categorie.files.splice(index - existingCount, 1);
        URL.revokeObjectURL(categorie.previews[index]);
      }
      categorie.previews.splice(index, 1);
    }
  }

  soumettreAnnonce(event: Event) {
    event.preventDefault();
    this.chargement = true;
    this.erreurMessage = '';

    // Vérification propre avec notre modèle
    if (!this.annonceData.titre || !this.annonceData.prix || !this.annonceData.commune || !this.annonceData.type_contrat || !this.annonceData.description) {
      this.chargement = false;
      this.erreurMessage = 'Veuillez remplir tous les champs obligatoires du formulaire.';
      return;
    }

    const formData = new FormData();
    formData.append('titre', this.annonceData.titre);
    formData.append('prix', this.annonceData.prix.toString());
    formData.append('commune', this.annonceData.commune);
    formData.append('type_contrat', this.annonceData.type_contrat);
    formData.append('description', this.annonceData.description);
    formData.append('ville', this.ville);

    const equipementsArray = Object.keys(this.amenities).filter(k => this.amenities[k]);
    formData.append('equipements', JSON.stringify(equipementsArray));
    if (this.modeEdition) {
      const retained: Record<string, string[]> = {};
      this.categoriesPhotos.forEach(cat => retained[cat.code] = cat.existingImages ?? []);
      formData.append('retained_images', JSON.stringify(retained));
    }

    this.categoriesPhotos.forEach(cat => {
      cat.files.forEach((file) => {
        formData.append(`images_${cat.code}[]`, file);
      });
    });

    // 4. Choix dynamique : Mettre à jour (si id existe) OU Créer
    const requete$ = this.modeEdition && this.idEdition 
      ? this.annonceService.updateAnnonce(this.idEdition, formData)
      : this.annonceService.creerAnnonce(formData);

    requete$.subscribe({
      next: (res: any) => {
        this.chargement = false;
        if (res.success) {
          this.formSoumis = true; // Affiche ton message de succès "Publiée !" ou "Modifiée !"
        } else {
          this.erreurMessage = res.message || 'Une erreur est survenue.';
        }
      },
      error: (err: any) => {
        this.chargement = false;
        this.erreurMessage = 'Impossible d\'enregistrer. Vérifiez votre connexion.';
      }
    });
  }
}
