import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
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
export class Profil implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
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
  currentPassword = '';
  emailCode = '';
  emailChangeError = '';
  emailChangeBusy = false;

  constructor(
    private authService: AuthService,
    private annonceService: AnnonceService,
    private visiteService: VisiteService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.user$.pipe(takeUntil(this.destroyed$)).subscribe(user => {
      this.user = user;
      if (user) {
        this.initEditForm();
      }
    });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  initEditForm() {
    this.currentPassword = '';
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
    if (this.isLoading || this.emailChangeBusy) return;
    this.isLoading = true;
    const formData = new FormData();
    formData.append('name', this.editForm.name);
    formData.append('email', this.editForm.email);
    formData.append('phone', this.editForm.phone);
    if (this.currentPassword) formData.append('current_password', this.currentPassword);
    if (this.selectedAvatar) {
      formData.append('avatar', this.selectedAvatar);
    }

    this.authService.updateProfile(formData).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.isEditing = false;
          this.currentPassword = '';
          this.emailCode = '';
          this.emailChangeError = '';
          Swal.fire('Succ�s', res.message || 'Profil mis � jour avec succ�s !', 'success');
        }
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire('Erreur', err.error?.message || 'Impossible de mettre � jour le profil.', 'error');
      }
    });
  }

  confirmEmail() {
    if (this.emailChangeBusy || this.isLoading) return;
    if (!/^[0-9]{6}$/.test(this.emailCode)) {
      this.emailChangeError = 'Saisissez le code � six chiffres re�u par e-mail.';
      return;
    }
    this.emailChangeBusy = true;
    this.emailChangeError = '';
    this.authService.confirmEmailChange(this.emailCode).subscribe({
      next: (response) => {
        this.emailChangeBusy = false;
        this.emailCode = '';
        void Swal.fire('Adresse confirm�e', response.message, 'success');
        void this.router.navigate(['/auth']);
      },
      error: (err) => {
        this.emailChangeBusy = false;
        this.emailChangeError = err.error?.message || 'Confirmation impossible. R�essayez.';
      }
    });
  }

  cancelEmail() {
    if (this.emailChangeBusy || this.isLoading) return;
    this.emailChangeBusy = true;
    this.authService.cancelEmailChange().subscribe({
      next: () => {
        this.emailChangeBusy = false;
        this.emailCode = '';
        this.emailChangeError = '';
      },
      error: (err) => {
        this.emailChangeBusy = false;
        this.emailChangeError = err.error?.message || 'Annulation impossible. R�essayez.';
      }
    });
  }

  resendEmailCode() {
    if (this.emailChangeBusy || !this.user?.pending_email) return;
    this.initEditForm();
    this.editForm.email = this.user.pending_email;
    this.isEditing = true;
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
