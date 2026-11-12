<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class EmailChangeCode extends Mailable
{
    public function __construct(public string $code, public string $userName) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Confirmez votre nouvelle adresse e-mail - Macaz');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.email_change');
    }
}
