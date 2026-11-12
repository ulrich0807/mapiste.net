<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_link_targets_the_frontend_and_does_not_expose_account_existence(): void
    {
        Notification::fake();
        config(['auth.frontend_url' => 'https://frontend.example']);
        $user = User::factory()->create();
        $known = $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
        $unknown = $this->postJson('/api/forgot-password', ['email' => 'absent@example.com'])->assertOk();
        $this->assertSame($known->json(), $unknown->json());
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            $url = $notification->toMail($user)->actionUrl;
            $this->assertStringStartsWith('https://frontend.example/reinitialiser-mot-de-passe?', $url);
            parse_str(parse_url($url, PHP_URL_QUERY), $query);
            $this->assertSame($user->email, $query['email']);
            $this->assertSame($notification->token, $query['token']);
            return true;
        });
    }

    public function test_reset_changes_password_revokes_tokens_and_consumes_link(): void
    {
        $user = User::factory()->create();
        $user->createToken('old-session');
        $user->forceFill([
            'pending_email' => 'pending@example.com',
            'email_change_code_hash' => Hash::make('123456'),
            'email_change_expires_at' => now()->addMinutes(15),
        ])->save();
        $token = Password::createToken($user);
        $data = [
            'email' => $user->email, 'token' => $token,
            'password' => 'new-password123', 'password_confirmation' => 'new-password123',
        ];
        $this->postJson('/api/reset-password', $data)->assertOk();
        $this->assertTrue(Hash::check('new-password123', $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count());
        $this->assertNull($user->fresh()->pending_email);
        $this->assertNull($user->fresh()->email_change_code_hash);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        $this->postJson('/api/reset-password', $data)->assertStatus(422);
    }

    public function test_expired_link_cannot_change_password(): void
    {
        $user = User::factory()->create();
        $token = Password::createToken($user);
        $this->travel(61)->minutes();
        $this->postJson('/api/reset-password', [
            'email' => $user->email, 'token' => $token,
            'password' => 'new-password123', 'password_confirmation' => 'new-password123',
        ])->assertStatus(422);
        $this->assertTrue(Hash::check('password', $user->fresh()->password));
    }

    public function test_password_confirmation_is_required(): void
    {
        $user = User::factory()->create();
        $this->postJson('/api/reset-password', [
            'email' => $user->email, 'token' => Password::createToken($user),
            'password' => 'new-password123', 'password_confirmation' => 'different',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertTrue(Hash::check('password', $user->fresh()->password));
    }

    public function test_suspended_account_cannot_receive_or_use_reset_link(): void
    {
        Notification::fake();
        $user = User::factory()->create(['is_active' => false]);
        $token = Password::createToken($user);
        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
        Notification::assertNothingSent();
        $this->postJson('/api/reset-password', [
            'email' => $user->email, 'token' => $token,
            'password' => 'new-password123', 'password_confirmation' => 'new-password123',
        ])->assertStatus(422);
        $this->assertTrue(Hash::check('password', $user->fresh()->password));
    }
}
