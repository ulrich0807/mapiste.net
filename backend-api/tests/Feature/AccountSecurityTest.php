<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_cannot_request_admin_role(): void
    {
        Mail::fake();
        $this->postJson('/api/register', [
            'name' => 'Test', 'email' => 'test@example.com',
            'password' => 'password123', 'role' => 'admin',
        ])->assertStatus(400);
        $this->assertDatabaseCount('users', 0);
        Mail::assertNothingSent();
    }

    public function test_suspended_account_cannot_login_or_use_existing_token(): void
    {
        $user = User::factory()->create(['is_active' => false]);
        $this->postJson('/api/login', [
            'email' => $user->email, 'password' => 'password',
        ])->assertForbidden();

        $token = $user->createToken('test')->plainTextToken;
        $this->withToken($token)->getJson('/api/user')->assertForbidden();
    }

    public function test_suspension_revokes_tokens(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();
        $user->createToken('existing');
        Sanctum::actingAs($admin);

        $this->postJson("/api/admin/users/{$user->id}/toggle-active")->assertOk();
        $this->assertFalse($user->fresh()->is_active);
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_suspended_account_cannot_verify_otp(): void
    {
        $user = User::factory()->unverified()->create([
            'is_active' => false, 'otp_code' => '123456',
            'otp_expires_at' => now()->addMinutes(15),
        ]);
        $this->postJson('/api/verify-otp', [
            'email' => $user->email, 'otp_code' => '123456',
        ])->assertForbidden();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_attempts_are_limited(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/login', [
                'email' => 'missing@example.com', 'password' => 'wrong',
            ])->assertUnauthorized();
        }
        $this->postJson('/api/login', [
            'email' => 'missing@example.com', 'password' => 'wrong',
        ])->assertStatus(429);
    }

    public function test_logout_revokes_the_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;
        $this->withToken($token)->postJson('/api/logout')->assertOk();
        $this->assertSame(0, $user->tokens()->count());
    }
}
