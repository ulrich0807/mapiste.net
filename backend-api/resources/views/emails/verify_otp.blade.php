<!DOCTYPE html>
<html>
<head>
    <title>Code de vérification - Macaz</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #333333; text-align: center;">Bienvenue sur Macaz !</h2>
        <p style="color: #555555; font-size: 16px;">Bonjour <strong>{{ $userName }}</strong>,</p>
        <p style="color: #555555; font-size: 16px;">Merci de vous être inscrit sur Macaz. Pour finaliser la création de votre compte, veuillez utiliser le code de vérification suivant :</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; padding: 15px 30px; background-color: #f97316; color: #ffffff; font-size: 24px; font-weight: bold; border-radius: 5px; letter-spacing: 5px;">
                {{ $otpCode }}
            </span>
        </div>
        
        <p style="color: #555555; font-size: 14px;">Ce code est valide pendant 15 minutes.</p>
        <p style="color: #555555; font-size: 14px;">Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.</p>
        
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
        <p style="color: #999999; font-size: 12px; text-align: center;">&copy; {{ date('Y') }} Macaz. Tous droits réservés.</p>
    </div>
</body>
</html>
