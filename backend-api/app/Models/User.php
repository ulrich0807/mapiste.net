<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'role',
        'avatar',
        'password',
        'otp_code',
        'otp_expires_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'pending_email',
        'email_change_code_hash',
        'email_change_expires_at',
        'email_change_attempts',
        'otp_code',
        'otp_expires_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_admin' => 'boolean',
            'email_verified_at' => 'datetime',
            'email_change_expires_at' => 'datetime',
            'email_change_attempts' => 'integer',
            'password' => 'hashed',
        ];
    }

    public function favoris()
    {
        return $this->belongsToMany(Annonce::class, 'annonce_user_favoris');
    }

    public function visites()
    {
        return $this->hasMany(Visite::class, 'locataire_id');
    }

    public function messagesSent()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function messagesReceived()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function avis()
    {
        return $this->hasMany(Avis::class, 'user_id');
    }

    public function avisRecus()
    {
        return $this->hasMany(Avis::class, 'target_id');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function leads()
    {
        return $this->hasMany(Lead::class);
    }

    public function leadPurchases()
    {
        return $this->hasMany(LeadPurchase::class, 'professional_id');
    }
}
