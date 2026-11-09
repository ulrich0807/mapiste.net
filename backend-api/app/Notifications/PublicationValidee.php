<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PublicationValidee extends Notification
{
    use Queueable;

    protected $titre;
    protected $type_publication;

    /**
     * Create a new notification instance.
     */
    public function __construct($titre, $type_publication)
    {
        $this->titre = $titre;
        $this->type_publication = $type_publication; // 'annonce' ou 'decouverte'
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database']; // On utilise les notifications internes (cloche)
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $typeStr = $this->type_publication === 'annonce' ? 'annonce immobilière' : 'établissement/service';
        
        return [
            'type_notif' => 'validation',
            'message' => "Félicitations ! Votre {$typeStr} \"{$this->titre}\" a été validée par un administrateur et est maintenant en ligne.",
            'url' => $this->type_publication === 'annonce' ? '/gerer' : '/annuaire'
        ];
    }
}
