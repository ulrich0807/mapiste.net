<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\LeadPurchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadAccessTest extends TestCase
{
    use RefreshDatabase;

    private function lead(?User $owner = null, array $attributes = []): Lead
    {
        return Lead::create(array_merge([
            'user_id' => ($owner ?? User::factory()->create())->id,
            'titre' => 'Recherche appartement', 'description' => 'Deux pieces a Cocody',
            'telephone' => '0700000000', 'budget' => 100000, 'is_active' => true,
        ], $attributes));
    }

    private function input(): array
    {
        return [
            'titre' => 'Recherche artisan', 'description' => 'Travaux de plomberie',
            'telephone' => '+225 0700000000', 'budget' => 10000, 'localisation' => 'Bingerville',
        ];
    }

    public function test_guest_cannot_read_phone_in_list_or_detail(): void
    {
        $lead = $this->lead();
        $this->getJson('/api/leads')->assertOk()
            ->assertJsonPath('data.0.telephone', null)
            ->assertJsonPath('data.0.has_purchased', false)
            ->assertJsonPath('data.0.can_view_contact', false);
        $this->getJson("/api/leads/{$lead->id}")->assertOk()
            ->assertJsonPath('data.telephone', null)
            ->assertJsonMissingPath('data.user_id');
        $this->assertArrayNotHasKey('telephone', $lead->toArray());
    }

    public function test_buyer_is_recognized_with_sanctum_bearer_token(): void
    {
        $lead = $this->lead();
        $buyer = User::factory()->create();
        LeadPurchase::create(['lead_id' => $lead->id, 'professional_id' => $buyer->id]);
        $this->withToken($buyer->createToken('buyer')->plainTextToken);
        $this->getJson('/api/leads')->assertOk()
            ->assertJsonPath('data.0.telephone', '0700000000')
            ->assertJsonPath('data.0.has_purchased', true);
       $response = $this->getJson("/api/leads/{$lead->id}")
    ->assertOk()
    ->assertJsonPath('data.telephone', '0700000000')
    ->assertJsonPath('data.can_view_contact', true);

$vary = array_map(
    'strtolower',
    array_map('trim', explode(',', $response->headers->get('Vary', '')))
);

$this->assertContains('authorization', $vary);
$this->assertContains('cookie', $vary);

        // CORS peut ajouter Origin ; les noms d'en-tete sont insensibles a la casse.
        $vary = array_map('strtolower', array_map('trim', explode(',', (string) $response->headers->get('Vary'))));
        $this->assertContains('authorization', $vary);
        $this->assertContains('cookie', $vary);
        $cacheControl = array_map('trim', explode(',', strtolower((string) $response->headers->get('Cache-Control'))));
        $this->assertContains('private', $cacheControl);
        $this->assertContains('no-store', $cacheControl);
    }

    public function test_another_users_purchase_does_not_grant_access(): void
    {
        $lead = $this->lead();
        LeadPurchase::create(['lead_id' => $lead->id, 'professional_id' => User::factory()->create()->id]);
        $viewer = User::factory()->create();
        $this->withToken($viewer->createToken('viewer')->plainTextToken)
            ->getJson("/api/leads/{$lead->id}")->assertOk()
            ->assertJsonPath('data.telephone', null)
            ->assertJsonPath('data.has_purchased', false);
    }

    public function test_owner_can_read_own_contact_without_purchase(): void
    {
        $owner = User::factory()->create();
        $lead = $this->lead($owner);
        $this->withToken($owner->createToken('owner')->plainTextToken)
            ->getJson("/api/leads/{$lead->id}")->assertOk()
            ->assertJsonPath('data.telephone', '0700000000')
            ->assertJsonPath('data.is_owner', true)
            ->assertJsonPath('data.has_purchased', false);
    }

    public function test_inactive_leads_are_not_public(): void
    {
        $lead = $this->lead(null, ['is_active' => false]);
        $this->getJson('/api/leads')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson("/api/leads/{$lead->id}")->assertNotFound();
    }

    public function test_guest_submission_is_saved_without_fabricating_a_user(): void
    {
        $this->postJson('/api/leads', $this->input())->assertCreated()
            ->assertJsonPath('lead.telephone', null);
        $this->assertDatabaseHas('leads', ['titre' => 'Recherche artisan', 'user_id' => null]);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_authenticated_submission_uses_the_token_owner_and_ignores_forged_fields(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $this->withToken($owner->createToken('owner')->plainTextToken)
            ->postJson('/api/leads', array_merge($this->input(), [
                'user_id' => $other->id, 'has_purchased' => true, 'is_active' => false,
            ]))->assertCreated()->assertJsonPath('lead.is_owner', true);
        $this->assertDatabaseHas('leads', ['user_id' => $owner->id, 'is_active' => true]);
        $this->assertDatabaseCount('lead_purchases', 0);
    }

    public function test_invalid_budget_and_oversized_fields_are_rejected(): void
    {
        $this->postJson('/api/leads', array_merge($this->input(), [
            'budget' => -10, 'localisation' => str_repeat('x', 256),
            'description' => str_repeat('x', 5001),
        ]))->assertUnprocessable()->assertJsonValidationErrors(['budget', 'localisation', 'description']);
        $this->assertDatabaseCount('leads', 0);
    }

    public function test_suspended_buyer_cannot_access_leads(): void
    {
        $lead = $this->lead();
        $buyer = User::factory()->create(['is_active' => false]);
        LeadPurchase::create(['lead_id' => $lead->id, 'professional_id' => $buyer->id]);
        $this->withToken($buyer->createToken('suspended')->plainTextToken)
            ->getJson("/api/leads/{$lead->id}")->assertForbidden()
            ->assertJsonPath('code', 'ACCOUNT_SUSPENDED');
        $this->postJson('/api/leads', $this->input())->assertForbidden();
    }

    public function test_invalid_token_is_not_silently_treated_as_an_anonymous_submission(): void
    {
        $this->withToken('invalid')->postJson('/api/leads', $this->input())->assertUnauthorized();
        $this->assertDatabaseCount('leads', 0);
    }

    public function test_guest_submissions_are_limited_to_five_per_hour(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/leads', $this->input())->assertCreated();
        }
        $this->postJson('/api/leads', $this->input())->assertStatus(429);
        $this->assertDatabaseCount('leads', 5);
    }

    public function test_list_is_paginated_and_page_is_validated(): void
    {
        $owner = User::factory()->create();
        for ($i = 0; $i < 16; $i++) {
            $this->lead($owner);
        }
        $this->getJson('/api/leads')->assertOk()->assertJsonCount(15, 'data')
            ->assertJsonPath('meta.total', 16)->assertJsonPath('meta.last_page', 2);
        $this->getJson('/api/leads?page=2')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/leads?page=-1')->assertUnprocessable();
    }

    public function test_authenticated_author_has_the_account_quota_instead_of_guest_quota(): void
    {
        $owner = User::factory()->create();
        $this->withToken($owner->createToken('owner')->plainTextToken);
        for ($attempt = 0; $attempt < 20; $attempt++) {
            $this->postJson('/api/leads', $this->input())->assertCreated();
        }
        $this->postJson('/api/leads', $this->input())->assertStatus(429);
        $this->assertDatabaseCount('leads', 20);
    }
}
