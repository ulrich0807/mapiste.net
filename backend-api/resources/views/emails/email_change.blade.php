<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Nouvelle adresse e-mail</title></head>
<body style="font-family:Arial,sans-serif;color:#222;background:#f4f7f6;padding:24px">
  <main style="max-width:560px;margin:auto;background:white;padding:32px;border-radius:12px">
    <h1 style="font-size:24px">Confirmez votre nouvelle adresse</h1>
    <p>Bonjour {{ $userName }},</p>
    <p>Pour confirmer le changement de votre adresse e-mail sur Macaz, saisissez ce code dans votre profil :</p>
    <p style="font-size:30px;font-weight:bold;letter-spacing:6px;color:#c2410c">{{ $code }}</p>
    <p>Ce code expire dans 15 minutes et ne peut �tre utilis� qu'une fois.</p>
    <p>Votre adresse actuelle reste active jusqu'� la confirmation. Si vous n'�tes pas � l'origine de cette demande, ignorez cet e-mail.</p>
  </main>
</body>
</html>
