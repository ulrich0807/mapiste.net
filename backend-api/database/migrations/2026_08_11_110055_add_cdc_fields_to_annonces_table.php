<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('annonces', function (Blueprint $table) {
            $table->string('type_logement')->default('appartement')->after('type_contrat');
            $table->integer('caution')->nullable()->after('prix');
            $table->integer('avances')->nullable()->after('caution');
            $table->json('equipements')->nullable()->after('description');
            $table->enum('statut', ['brouillon', 'publiee', 'louee', 'vendu'])->default('brouillon')->after('images');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('annonces', function (Blueprint $table) {
            $table->dropColumn(['type_logement', 'caution', 'avances', 'equipements', 'statut']);
        });
    }
};
