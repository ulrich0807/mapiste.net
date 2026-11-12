#!/usr/bin/env bash
set -euo pipefail

: "${SSH_PRIVATE_KEY:?Secret MACAZ_SSH_PRIVATE_KEY manquant}"
: "${SSH_KEY_PASSPHRASE:?Secret MACAZ_SSH_PASSPHRASE manquant}"
: "${SSH_KNOWN_HOSTS:?Secret MACAZ_SSH_KNOWN_HOSTS manquant}"

artifacts="$RUNNER_TEMP/macaz"
test -f "$artifacts/angular/index.html"
test -s "$artifacts/macaz-laravel.tar.gz"
release_id="$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
[[ "$release_id" =~ ^[0-9]+-[0-9]+$ ]]

umask 077
ssh_dir=$(mktemp -d)
trap 'rm -rf -- "$ssh_dir"' EXIT
printf '%s\n' "$SSH_PRIVATE_KEY" | tr -d '\r' > "$ssh_dir/key"
printf '%s\n' "$SSH_KNOWN_HOSTS" | tr -d '\r' > "$ssh_dir/known_hosts"
cat > "$ssh_dir/askpass" <<'ASKPASS'
#!/bin/sh
printf '%s\n' "$SSH_KEY_PASSPHRASE"
ASKPASS
chmod 700 "$ssh_dir/askpass"
eval "$(ssh-agent -s)" > /dev/null
trap 'ssh-agent -k > /dev/null; rm -rf -- "$ssh_dir"' EXIT
SSH_ASKPASS="$ssh_dir/askpass" SSH_ASKPASS_REQUIRE=force ssh-add "$ssh_dir/key" < /dev/null
unset SSH_PRIVATE_KEY SSH_KEY_PASSPHRASE SSH_KNOWN_HOSTS

cat > "$ssh_dir/config" <<SSH_CONFIG
Host macaz
  HostName 66.29.148.119
  Port 21098
  User wfbnqswlws
  IdentityFile $ssh_dir/key
  UserKnownHostsFile $ssh_dir/known_hosts
  StrictHostKeyChecking yes
  IdentitiesOnly yes
  BatchMode yes
  ConnectTimeout 10
SSH_CONFIG

remote_root=/home/wfbnqswlws/macaz-deploy
incoming="$remote_root/incoming/$release_id"
ssh -F "$ssh_dir/config" macaz "test -s '$remote_root/shared/.env' || { echo 'Creer $remote_root/shared/.env sur Spaceship' >&2; exit 1; }; umask 077; mkdir -p '$incoming'"
rsync -a -e "ssh -F $ssh_dir/config" "$artifacts/" "macaz:$incoming/"

ssh -F "$ssh_dir/config" macaz "bash -s -- '$release_id'" <<'REMOTE'
set -euo pipefail
release_id=$1
root=/home/wfbnqswlws/macaz-deploy
web=/home/wfbnqswlws/macaz.net
incoming="$root/incoming/$release_id"
release="$root/releases/$release_id"
shared="$root/shared"

if [[ -e "$web/.htaccess" || -e "$web/index.html" || -e "$web/index.php" || -e "$web/macaz-api.php" ]]; then
  if ! grep -Fxq '# MACAZ deployment' "$web/.htaccess"; then
    echo "La racine web contient un site existant. Sauvegarder et deplacer ses fichiers d'entree avant le premier deploiement." >&2
    exit 1
  fi
fi

if [[ -e "$web/storage" || -L "$web/storage" ]]; then
  test "$(readlink "$web/storage")" = "$shared/storage/app/public"
fi

mkdir -p "$root/releases" "$shared/storage/app/"{public,private} \
  "$shared/storage/framework/"{cache/data,sessions,views} "$shared/storage/logs"
mkdir "$release"
tar -xzf "$incoming/macaz-laravel.tar.gz" -C "$release"
ln -s "$shared/.env" "$release/.env"
mv "$release/storage" "$incoming/storage-template"
ln -s "$shared/storage" "$release/storage"

cd "$release"
php artisan config:cache
php -r '
    $config = require "bootstrap/cache/config.php";
    $app = $config["app"];
    if ($app["env"] !== "production" || $app["debug"] || !$app["key"] || rtrim($app["url"], "/") !== "https://macaz.net") {
        fwrite(STDERR, "Configuration Laravel de production invalide\n");
        exit(1);
    }
'
php artisan migrate --force --no-interaction

cat > "$incoming/.htaccess" <<'APACHE'
# MACAZ deployment
DirectoryIndex index.html
<IfModule mod_headers.c>
    <Files "index.html">
        Header set Cache-Control "no-cache"
    </Files>
</IfModule>
RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteRule ^(api(/.*)?|up)$ macaz-api.php [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
APACHE

cat > "$incoming/macaz-api.php" <<'PHP'
<?php

require '/home/wfbnqswlws/macaz-deploy/current/public/index.php';
PHP

rsync -r --chmod=D755,F644 --exclude=/index.html "$incoming/angular/" "$web/"
if [[ ! -L "$web/storage" ]]; then
  ln -s "$shared/storage/app/public" "$web/storage"
fi
ln -s "$release" "$incoming/current"
mv -Tf "$incoming/current" "$root/current"
install -m 644 "$incoming/macaz-api.php" "$web/.macaz-api.php.$release_id"
install -m 644 "$incoming/.htaccess" "$web/.htaccess.$release_id"
install -m 644 "$incoming/angular/index.html" "$web/.index.html.$release_id"
mv -f "$web/.macaz-api.php.$release_id" "$web/macaz-api.php"
mv -f "$web/.htaccess.$release_id" "$web/.htaccess"
mv -f "$web/.index.html.$release_id" "$web/index.html"
REMOTE

curl --fail --silent --show-error --retry 3 --max-time 15 \
  "https://macaz.net/up?release=$release_id" > /dev/null
curl --fail --silent --show-error --retry 3 --max-time 15 \
  -H 'Accept: application/json' "https://macaz.net/api/annonces?release=$release_id" |
  jq -e 'type == "object" or type == "array"' > /dev/null
curl --fail --silent --show-error --retry 3 --max-time 15 \
  "https://macaz.net/?release=$release_id" > "$ssh_dir/index.html"
cmp "$artifacts/angular/index.html" "$ssh_dir/index.html"
