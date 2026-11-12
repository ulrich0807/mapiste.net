<?php

namespace Tests\Feature;

use App\Models\Annonce;
use App\Models\Decouverte;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PublicationSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function annonce(User $owner): Annonce
    {
        return Annonce::factory()->create([
            'user_id' => $owner->id,
            'equipements' => ['eau'],
            'images' => json_encode(['salon' => ['http://localhost/storage/old.jpg']]),
        ]);
    }

    public function test_guest_cannot_read_pending_publications_or_their_reviews(): void
    {
        $owner = User::factory()->create();
        $annonce = $this->annonce($owner);
        $decouverte = Decouverte::create([
            'user_id' => $owner->id, 'nom' => 'Test', 'categorie' => 'artisan',
            'description' => 'Test', 'commune' => 'Cocody', 'telephone' => '0700000000',
        ]);
        $this->getJson("/api/annonces/{$annonce->id}")->assertNotFound();
        $this->getJson("/api/annonces/{$annonce->id}/avis")->assertNotFound();
        $this->getJson("/api/decouvertes/{$decouverte->id}")->assertNotFound();
    }

    public function test_owner_can_read_pending_publication_with_bearer_token(): void
    {
        $owner = User::factory()->create();
        $annonce = $this->annonce($owner);
        $this->withToken($owner->createToken('test')->plainTextToken)
            ->getJson("/api/annonces/{$annonce->id}")->assertOk();
    }

    public function test_other_user_cannot_read_pending_publication(): void
    {
        $annonce = $this->annonce(User::factory()->create());
        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/annonces/{$annonce->id}")->assertNotFound();
    }

    public function test_guest_can_read_approved_publication(): void
    {
        $annonce = $this->annonce(User::factory()->create());
        $annonce->forceFill(['est_valide' => true])->save();
        $this->getJson("/api/annonces/{$annonce->id}")->assertOk();
    }

    public function test_owner_can_clear_equipment_and_remove_an_existing_photo(): void
    {
        $owner = User::factory()->create();
        $annonce = $this->annonce($owner);
        $annonce->forceFill(['est_valide' => true])->save();
        Sanctum::actingAs($owner);
        $this->postJson("/api/annonces/{$annonce->id}/update", [
            'equipements' => '[]', 'retained_images' => '{"salon":[]}',
        ])->assertOk();

        $this->assertSame([], $annonce->fresh()->equipements);
        $this->assertSame([], json_decode($annonce->fresh()->images, true)['salon']);
        $this->assertFalse((bool) $annonce->fresh()->est_valide);
    }

    public function test_photos_from_another_publication_cannot_be_injected(): void
    {
        $owner = User::factory()->create();
        $annonce = $this->annonce($owner);
        Sanctum::actingAs($owner);
        $this->postJson("/api/annonces/{$annonce->id}/update", [
            'retained_images' => ['salon' => ['http://localhost/storage/other.jpg']],
        ])->assertStatus(422);
        $this->assertSame(['http://localhost/storage/old.jpg'], json_decode($annonce->fresh()->images, true)['salon']);
    }

    public function test_new_photo_is_added_to_its_category_without_losing_old_photos(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        $annonce = $this->annonce($owner);
        Sanctum::actingAs($owner);
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=');
        $this->post("/api/annonces/{$annonce->id}/update", [
            'images_chambre' => [UploadedFile::fake()->createWithContent('photo.png', $png)],
        ], ['Accept' => 'application/json'])->assertOk();
        $images = json_decode($annonce->fresh()->images, true);
        $this->assertCount(1, $images['salon']);
        $this->assertCount(1, $images['chambre']);
        $this->assertCount(1, Storage::disk('public')->allFiles('annonces/chambre'));
    }

    public function test_annuaire_rejects_non_image_uploads(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create());
        $this->post('/api/decouvertes', [
            'nom' => 'Test', 'categorie' => 'artisan', 'description' => 'Test',
            'commune' => 'Cocody', 'telephone' => '0700000000',
            'images' => [UploadedFile::fake()->create('script.php', 1, 'application/x-php')],
        ], ['Accept' => 'application/json'])->assertStatus(400);
        $this->assertDatabaseCount('decouvertes', 0);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_payment_and_free_boost_cannot_create_benefits(): void
    {
        $owner = User::factory()->create();
        $annonce = $this->annonce($owner);
        $this->postJson('/api/payment/callback', [
            'reference' => 'FAKE', 'status' => 'success', 'reference_id' => $annonce->id,
        ])->assertStatus(503);
        Sanctum::actingAs($owner);
        $this->postJson('/api/payment/initiate', [
            'type' => 'boost', 'amount' => 1, 'reference_id' => $annonce->id,
        ])->assertStatus(503);
        $this->postJson("/api/annonces/{$annonce->id}/boost")->assertStatus(503);
        $this->assertFalse((bool) $annonce->fresh()->is_premium);
        $this->assertDatabaseCount('transactions', 0);
    }
}
