<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeadPurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'professional_id',
        'transaction_id',
        'purchased_at'
    ];

    protected $casts = [
        'purchased_at' => 'datetime',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function professional()
    {
        return $this->belongsTo(User::class, 'professional_id');
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}
