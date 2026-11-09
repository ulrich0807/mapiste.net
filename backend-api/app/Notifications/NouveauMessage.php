<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Message;

class NouveauMessage extends Notification implements ShouldQueue
{
    use Queueable;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message;
    }

    public function via($notifiable)
    {
        return ['database']; // On stocke en BDD pour le polling
    }

    public function toArray($notifiable)
    {
        return [
            'type_notification' => 'nouveau_message',
            'titre' => 'Nouveau message reçu',
            'message' => substr($this->message->contenu, 0, 50) . '...',
            'expediteur_id' => $this->message->expediteur_id,
            'annonce_id' => $this->message->annonce_id,
            'message_id' => $this->message->id,
            'url' => '/dashboard' 
        ];
    }
}
