<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('pending_email')->nullable();
            $table->string('email_change_code_hash')->nullable();
            $table->timestamp('email_change_expires_at')->nullable();
            $table->unsignedTinyInteger('email_change_attempts')->default(0);
        });

        // Le role metier ne confere jamais de droits d'administration.
        // Conserver is_admin, seule source des privileges existants.
        DB::table('users')->where('role', 'admin')->update(['role' => 'locataire']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['pending_email', 'email_change_code_hash', 'email_change_expires_at', 'email_change_attempts']);
        });
        // Les anciens libelles "admin" ne sont pas recrees ; is_admin est conserve.
    }
};
