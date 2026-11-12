<?php

namespace Tests\Feature;

use App\Mail\EmailChangeCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class EmailChangeTest extends TestCase
{
    use RefreshDatabase;

    private function requestChange(User $user): string
    {
        Mail::fake();
        $this->withToken($user->createToken('profile')->plainTextToken)
            ->postJson('/api/user/update', ['email' => 'new@example.com', 'current_password' => 'password'])
            ->assertOk()->assertJsonPath('user.email', $user->email)
            ->assertJsonPath('user.pending_email', 'new@example.com')
            ->assertJsonMissingPath('user.email_change_code_hash');

        $code = '';
        Mail::assertSent(EmailChangeCode::class, function ($mail) use (&$code) {
            $code = $mail->code;
            return $mail->hasTo('new@example.com');
        });
        return $code;
    }

    public function test_new_email_remains_pending_and_code_is_hashed_and_private(): void
    {
        $user = User::factory()->create();
        $code = $this->requestChange($user);
        $fresh = $user->fresh();
        $this->assertSame($user->email, $fresh->email);
        $this->assertTrue(Hash::check($code, $fresh->email_change_code_hash));
        foreach (['pending_email', 'email_change_code_hash', 'email_change_expires_at', 'email_change_attempts'] as $attribute) {
            $this->assertArrayNotHasKey($attribute, $fresh->toArray());
        }
        $this->getJson('/api/user')->assertOk()->assertJsonPath('pending_email', 'new@example.com');
    }

    public function test_email_change_requires_current_password_without_changing_other_fields(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $this->withToken($user->createToken('profile')->plainTextToken)
            ->postJson('/api/user/update', ['name' => 'Changed', 'email' => 'new@example.com'])
            ->assertStatus(422);
        $this->assertSame($user->name, $user->fresh()->name);
        $this->assertNull($user->fresh()->pending_email);
        Mail::assertNothingSent();
    }

    public function test_wrong_current_password_cannot_request_change(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $this->withToken($user->createToken('profile')->plainTextToken)
            ->postJson('/api/user/update', ['email' => 'new@example.com', 'current_password' => 'wrong'])
            ->assertStatus(422);
        Mail::assertNothingSent();
    }

    public function test_correct_code_changes_email_and_revokes_sessions_and_reset_links(): void
    {
        $user = User::factory()->create();
        Password::createToken($user);
        $code = $this->requestChange($user);
        $this->postJson('/api/user/email/verify', ['code' => $code])
            ->assertOk()->assertJsonPath('reauthenticate', true);

        $fresh = $user->fresh();
        $this->assertSame('new@example.com', $fresh->email);
        $this->assertNotNull($fresh->email_verified_at);
        $this->assertNull($fresh->pending_email);
        $this->assertNull($fresh->email_change_code_hash);
        $this->assertSame(0, $fresh->tokens()->count());
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
    }

    public function test_expired_code_preserves_current_email(): void
    {
        $user = User::factory()->create();
        $code = $this->requestChange($user);
        $this->travel(16)->minutes();
        $this->postJson('/api/user/email/verify', ['code' => $code])->assertStatus(422);
        $this->assertSame($user->email, $user->fresh()->email);
    }

    public function test_five_wrong_codes_invalidate_the_challenge(): void
    {
        $user = User::factory()->create();
        $code = $this->requestChange($user);
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/user/email/verify', ['code' => '000000'])->assertStatus(422);
        }
        $this->assertSame(5, $user->fresh()->email_change_attempts);
        $this->assertNull($user->fresh()->email_change_code_hash);
        $this->travel(61)->seconds();
        $this->postJson('/api/user/email/verify', ['code' => $code])->assertStatus(422);
        $this->assertSame($user->email, $user->fresh()->email);
    }

    public function test_cancellation_invalidates_the_code(): void
    {
        $user = User::factory()->create();
        $code = $this->requestChange($user);
        $this->postJson('/api/user/email/cancel')->assertOk();
        $this->postJson('/api/user/email/verify', ['code' => $code])->assertStatus(422);
        $this->assertNull($user->fresh()->pending_email);
        $this->assertSame($user->email, $user->fresh()->email);
    }

    public function test_email_uniqueness_is_checked_again_at_confirmation(): void
    {
        $user = User::factory()->create();
        $code = $this->requestChange($user);
        User::factory()->create(['email' => 'new@example.com']);
        $this->postJson('/api/user/email/verify', ['code' => $code])->assertStatus(422);
        $this->assertSame($user->email, $user->fresh()->email);
    }

    public function test_regular_profile_update_does_not_require_password_or_send_email(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $this->withToken($user->createToken('profile')->plainTextToken)
            ->postJson('/api/user/update', ['name' => 'New name', 'email' => $user->email])
            ->assertOk()->assertJsonPath('user.name', 'New name');
        Mail::assertNothingSent();
    }

    public function test_profile_cannot_change_roles_or_admin_permissions(): void
    {
        $user = User::factory()->create();
        $this->withToken($user->createToken('profile')->plainTextToken)
            ->postJson('/api/user/update', ['role' => 'admin', 'is_admin' => true])->assertStatus(400);
        $this->assertFalse($user->fresh()->is_admin);
        $this->assertSame('locataire', $user->fresh()->role);
    }

    public function test_admin_flag_and_business_role_are_independent(): void
    {
        $admin = User::factory()->create(['role' => 'proprietaire', 'is_admin' => true]);
        $target = User::factory()->create(['role' => 'proprietaire']);
        $target->createToken('old-session');
        $this->withToken($admin->createToken('admin')->plainTextToken)
            ->postJson("/api/admin/users/{$target->id}/toggle-admin")->assertOk();
        $this->assertSame('proprietaire', $target->fresh()->role);
        $this->assertTrue($target->fresh()->is_admin);
        $this->assertSame(0, $target->tokens()->count());
    }

    public function test_legacy_admin_role_without_admin_flag_does_not_grant_permissions(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'is_admin' => false]);
        $this->withToken($user->createToken('member')->plainTextToken)
            ->getJson('/api/admin/dashboard')->assertForbidden();
    }

    public function test_confirmed_code_cannot_be_used_again_after_reconnection(): void
    {
        $user = User::factory()->create();
        $code = $this->requestChange($user);
        $this->postJson('/api/user/email/verify', ['code' => $code])->assertOk();
        app('auth')->forgetGuards();
        $this->withToken($user->fresh()->createToken('new-session')->plainTextToken)
            ->postJson('/api/user/email/verify', ['code' => $code])->assertStatus(422);
    }

    public function test_another_user_cannot_confirm_the_change_with_the_same_code(): void
    {
        $user = User::factory()->create();
        $code = $this->requestChange($user);
        $other = User::factory()->create();
        app('auth')->forgetGuards();
        $this->withToken($other->createToken('other')->plainTextToken)
            ->postJson('/api/user/email/verify', ['code' => $code])->assertStatus(422);
        $this->assertSame($user->email, $user->fresh()->email);
    }
}
