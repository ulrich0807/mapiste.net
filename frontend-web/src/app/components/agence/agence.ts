import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-agence',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './agence.html',
})
export class Agence {
  chiffresCles = [
    { valeur: '15+', label: 'Années d\'expertise' },
    { valeur: '1200+', label: 'Biens vendus & loués' },
    { valeur: '98%', label: 'Clients satisfaits' },
    { valeur: '3', label: 'Agences en RCI' }
  ];

  services = [
    {
      titre: 'Vente Immobilière',
      description: 'Nous vous accompagnons de l\'estimation jusqu\'à la signature chez le notaire avec une stratégie sur mesure.',
      icone: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    {
      titre: 'Gestion Locative',
      description: 'Sécurisez vos revenus locatifs. Nous gérons vos locataires, les encaissements et la maintenance technique.',
      icone: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    },
    {
      titre: 'Résidences Meublées',
      description: 'Découvrez notre catalogue de meublés haut de gamme pour vos séjours d\'affaires ou vos vacances à Abidjan.',
      icone: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
    }
  ];

  equipe = [
    { 
      nom: 'Amira K.', 
      role: 'Directrice Générale', 
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' 
    },
    { 
      nom: 'Jean-Marc D.', 
      role: 'Expert Évaluation', 
      photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80' 
    },
    { 
      nom: 'Sarah L.', 
      role: 'Conseillère Location & Meublés', 
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80' 
    }
  ];
}