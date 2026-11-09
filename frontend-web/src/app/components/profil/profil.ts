import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { AnnonceService } from '../../services/annonce';
import { VisiteService } from '../../services/visite';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.html',
  styleUrls: ['./profil.css']
})
export class Profil implements OnInit {
  user: any = null;
  activeTab: 'infos' | 'favoris' | 'visites' = 'infos';
  
  favoris: any[] = [];
  visites: any[] = [];

  // Edition du profil
  isEditing = false;
  editForm = { name: '', email: '', phone: '' };
  selectedAvatar: File | null = null;
  avatarPreview: string | null = null;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private annonceService: AnnonceService,
    private visiteService: VisiteService
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.user = user;
        this.initEditForm();
      }
    });
  }

  initEditForm() {
    this.editForm = {
      name: this.user.name,
      email: this.user.email,
      phone: this.user.phone || ''
    };
    this.avatarPreview = this.user.avatar || `https://ui-avatars.com/api/?name=${this.user.name}&background=random`;
    this.selectedAvatar = null;
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.initEditForm(); // reset si on annule
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedAvatar = file;
      const reader = new FileReader();
      reader.onload = e => this.avatarPreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    this.isLoading = true;
    const formData = new FormData();
    formData.append('name', this.editForm.name);
    formData.append('email', this.editForm.email);
    formData.append('phone', this.editForm.phone);
    if (this.selectedAvatar) {
      formData.append('avatar', this.selectedAvatar);
    }

    this.authService.updateProfile(formData).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.isEditing = false;
          Swal.fire('Succès', 'Profil mis à jour avec succès !', 'success');
        }
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire('Erreur', 'Erreur lors de la mise à jour : ' + (err.error.message || ""), 'error');
      }
    });
  }

  switchTab(tab: 'infos' | 'favoris' | 'visites') {
    this.activeTab = tab;
    
    if (tab === 'favoris' && this.favoris.length === 0) {
      this.loadFavoris();
    } else if (tab === 'visites' && this.visites.length === 0) {
      this.loadVisites();
    }
  }

  loadFavoris() {
    this.annonceService.getMesFavoris().subscribe(res => {
      if (res.success) {
        this.favoris = res.data;
      }
    });
  }

  loadVisites() {
    if (this.user?.role === 'proprietaire') {
      this.visiteService.getDemandesRecues().subscribe(res => {
        if (res.success) this.visites = res.data;
      });
    } else {
      this.visiteService.getMesVisites().subscribe(res => {
        if (res.success) this.visites = res.data;
      });
    }
  }

  changerStatutVisite(id: number, statut: 'validee' | 'annulee' | 'terminee') {
    this.visiteService.changerStatut(id, statut).subscribe(res => {
      if (res.success) {
        const index = this.visites.findIndex(v => v.id === id);
        if (index !== -1) {
          this.visites[index].statut = statut;
        }
      }
    });
  }
}
