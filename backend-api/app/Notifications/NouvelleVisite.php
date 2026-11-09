<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Visite;

class NouvelleVisite extends Notification implements ShouldQueue
{
    use Queueable;

    public $visite;

    public function __construct(Visite $visite)
    {
        $this->visite = $visite;
    }

    public function via($notifiable)
    {
        return ['database']; 
    }

    public function toArray($notifiable)
    {
        return [
            'type_notification' => 'nouvelle_visite',
            'titre' => 'Nouvelle demande de visite',
            'message' => 'Une visite a été demandée le ' . $this->visite->date_visite,
            'visiteur_id' => $this->visite->locataire_id,
            'annonce_id' => $this->visite->annonce_id,
            'visite_id' => $this->visite->id,
            'url' => '/dashboard' 
        ];
    }
}
