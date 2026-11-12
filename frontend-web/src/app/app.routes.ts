import { Routes } from '@angular/router';
import { MapView } from './components/map-view/map-view';
import { AnnonceDetail } from './components/annonce-detail/annonce-detail';
import { Vendre } from './components/vendre/vendre';
import { Louer } from './components/louer/louer';
import { Gerer } from './components/gerer/gerer';
import { Abidjan } from './components/abidjan/abidjan';
import { Agence } from './components/agence/agence';
import { Auth } from './components/auth/auth';
import { MotDePasseOublie } from './components/mot-de-passe-oublie/mot-de-passe-oublie';
import { ReinitialiserMotDePasse } from './components/reinitialiser-mot-de-passe/reinitialiser-mot-de-passe';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { DecouverteDetail } from './components/decouverte-detail/decouverte-detail';
import { Admin } from './components/admin/admin';
import { Messagerie } from './components/messagerie/messagerie';
import { Profil } from './components/profil/profil';
import { Tarifs } from './components/tarifs/tarifs';
import { LeadsBoardComponent } from './components/leads-board/leads-board';
import { SubscriptionPlansComponent } from './components/subscription-plans/subscription-plans';

export const routes: Routes = [
  { path: '', component: MapView },
  { path: 'annonce/:id', component: AnnonceDetail },
  { path: 'tarifs', component: Tarifs },
  { path: 'louer', component: Louer },    // <-- Connect� !
// ---> On ajoute le "canActivate" ici pour s�curiser la page
  { path: 'vendre', component: Vendre, canActivate: [authGuard] }, 
  { path: 'gerer', component: Gerer, canActivate: [authGuard] },
  { path: 'abidjan', component: Abidjan },
{ path: 'decouverte/:id', component: DecouverteDetail },
  { path: 'agence', component: Agence },
  { path: 'auth', component: Auth } ,
  { path: 'mot-de-passe-oublie', component: MotDePasseOublie },
  { path: 'reinitialiser-mot-de-passe', component: ReinitialiserMotDePasse },
  { path: 'admin', component: Admin, canActivate: [adminGuard] },
  { path: 'messagerie', component: Messagerie, canActivate: [authGuard] },
  { path: 'profil', component: Profil, canActivate: [authGuard] },
  { path: 'leads', component: LeadsBoardComponent },
  { path: 'abonnements', component: SubscriptionPlansComponent },
];
