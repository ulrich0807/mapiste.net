import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagerieService } from '../../services/messagerie';
import { AuthService } from '../../services/auth';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-messagerie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messagerie.html',
  styleUrls: ['./messagerie.css']
})
export class Messagerie implements OnInit, OnDestroy {
  conversations: any[] = [];
  messages: any[] = [];
  selectedContact: any = null;
  newMessage: string = '';
  userId: number = 0;
  
  private pollingSub?: Subscription;

  constructor(
    private messagerieService: MessagerieService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.userId = user.id;
        this.loadConversations();
        // Polling pour rafraîchir les messages toutes les 5 secondes
        this.pollingSub = interval(5000).subscribe(() => {
          if (this.selectedContact) {
            this.loadMessages(this.selectedContact.interlocuteur.id, true);
          } else {
            this.loadConversations();
          }
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
  }

  loadConversations() {
    this.messagerieService.getConversations().subscribe(res => {
      if (res.success) {
        this.conversations = res.data;
      }
    });
  }

  selectContact(contact: any) {
    this.selectedContact = contact;
    contact.non_lus = 0; // Optimistic reset
    this.loadMessages(contact.interlocuteur.id);
  }

  loadMessages(interlocuteurId: number, isSilent: boolean = false) {
    this.messagerieService.getMessages(interlocuteurId).subscribe(res => {
      if (res.success) {
        this.messages = res.data;
        if (!isSilent) {
          this.scrollToBottom();
        }
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedContact) return;

    const receiverId = this.selectedContact.interlocuteur.id;
    const contenu = this.newMessage;
    this.newMessage = ''; // Reset input immediately

    this.messagerieService.sendMessage(receiverId, contenu).subscribe(res => {
      if (res.success) {
        this.messages.push(res.data);
        this.scrollToBottom();
        this.loadConversations(); // Update side list
      }
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
}
