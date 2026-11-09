import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagerieService } from '../../services/messagerie';
import { AuthService } from '../../services/auth';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.html',
  styleUrls: ['./chat-widget.css']
})
export class ChatWidget implements OnInit, OnDestroy {
  isOpen = false;
  view: 'list' | 'chat' = 'list';
  
  conversations: any[] = [];
  messages: any[] = [];
  selectedContact: any = null;
  newMessage: string = '';
  userId: number = 0;
  unreadTotal: number = 0;
  
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
        
        this.pollingSub = interval(5000).subscribe(() => {
          if (this.isOpen && this.view === 'chat' && this.selectedContact) {
            this.loadMessages(this.selectedContact.interlocuteur.id, true);
          } else {
            this.loadConversations(true);
          }
        });
      } else {
        this.userId = 0;
        this.isOpen = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.pollingSub) this.pollingSub.unsubscribe();
  }

  toggleWidget() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.view === 'list') {
      this.loadConversations();
    }
    if (this.isOpen && this.view === 'chat' && this.selectedContact) {
      this.loadMessages(this.selectedContact.interlocuteur.id);
    }
  }

  loadConversations(silent: boolean = false) {
    this.messagerieService.getConversations().subscribe(res => {
      if (res.success) {
        this.conversations = res.data;
        this.unreadTotal = this.conversations.reduce((acc, conv) => acc + (conv.non_lus || 0), 0);
      }
    });
  }

  openChat(contact: any) {
    this.selectedContact = contact;
    this.view = 'chat';
    contact.non_lus = 0;
    this.loadMessages(contact.interlocuteur.id);
  }

  backToList() {
    this.view = 'list';
    this.selectedContact = null;
    this.loadConversations();
  }

  loadMessages(interlocuteurId: number, silent: boolean = false) {
    this.messagerieService.getMessages(interlocuteurId).subscribe(res => {
      if (res.success) {
        this.messages = res.data;
        if (!silent) this.scrollToBottom();
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedContact) return;
    
    const receiverId = this.selectedContact.interlocuteur.id;
    const contenu = this.newMessage;
    this.newMessage = '';

    this.messagerieService.sendMessage(receiverId, contenu).subscribe(res => {
      if (res.success) {
        this.messages.push(res.data);
        this.scrollToBottom();
        this.loadConversations(true);
      }
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('widget-chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
}
