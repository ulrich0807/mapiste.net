<?php

namespace App\Http\Controllers;

use App\Http\Resources\LeadResource;
use App\Models\Lead;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    private function visibleLeads(Request $request)
    {
        $query = Lead::where('is_active', true);
        if ($user = $request->user()) {
            $query->withExists(['purchases as has_purchased' => fn ($purchases) =>
                $purchases->where('professional_id', $user->id)
            ]);
        }

        return $query;
    }

    public function index(Request $request)
    {
        $data = $request->validate(['page' => 'sometimes|integer|min:1']);
        $leads = $this->visibleLeads($request)->latest()->orderByDesc('id')
            ->paginate(15, ['*'], 'page', $data['page'] ?? 1);

        return LeadResource::collection($leads)->response()
            ->header('Cache-Control', 'private, no-store')
            ->header('Vary', 'Authorization, Cookie');
    }

    public function show(Request $request, string $id)
    {
        return (new LeadResource($this->visibleLeads($request)->findOrFail($id)))->response()
            ->header('Cache-Control', 'private, no-store')
            ->header('Vary', 'Authorization, Cookie');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'titre' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'telephone' => 'required|string|max:30|regex:/^\+?[0-9][0-9\s().-]{5,28}$/',
            'budget' => 'nullable|numeric|min:0|max:9999999999.99',
            'localisation' => 'nullable|string|max:255',
        ]);

        $lead = Lead::create(array_merge($data, [
            'user_id' => $request->user()?->id,
            'is_active' => true,
        ]));

        return response()->json([
            'message' => 'Demande creee avec succes.',
            'lead' => new LeadResource($lead),
        ], 201)->header('Cache-Control', 'private, no-store');
    }
}
