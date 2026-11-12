<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isOwner = $request->user() && (int) $this->user_id === (int) $request->user()->id;
        $hasPurchased = (bool) $this->resource->getAttribute('has_purchased');
        $canViewContact = $isOwner || $hasPurchased;

        return [
            'id' => $this->id,
            'titre' => $this->titre,
            'description' => $this->description,
            'budget' => $this->budget,
            'localisation' => $this->localisation,
            'telephone' => $canViewContact ? $this->telephone : null,
            'has_purchased' => $hasPurchased,
            'is_owner' => (bool) $isOwner,
            'can_view_contact' => $canViewContact,
            'created_at' => $this->created_at,
        ];
    }
}
