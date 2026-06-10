# Server setup (one-time)

The site is plain static files served by [Caddy](https://caddyserver.com) (automatic HTTPS).
GitHub Actions rsyncs `dist/` to the server on every push to `master`.

## 1. Install Caddy (Debian/Ubuntu)

```sh
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

## 2. Create the deploy user and webroot

```sh
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /var/www/hoeltke.com
sudo chown -R deploy:deploy /var/www/hoeltke.com

# key used by GitHub Actions (generate locally, see step 4)
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy chmod 700 /home/deploy/.ssh
echo "<PUBLIC KEY FROM STEP 4>" | sudo -u deploy tee /home/deploy/.ssh/authorized_keys
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys
```

## 3. Caddyfile

Replace `/etc/caddy/Caddyfile` with:

```caddy
hoeltke.com {
	root * /var/www/hoeltke.com
	encode zstd gzip
	file_server

	handle_errors {
		@404 expression {http.error.status_code} == 404
		rewrite @404 /404.html
		file_server
	}

	# fingerprinted assets are immutable
	@assets path /_astro/*
	header @assets Cache-Control "public, max-age=31536000, immutable"

	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
	}
}

www.hoeltke.com {
	redir https://hoeltke.com{uri} permanent
}
```

Then: `sudo systemctl reload caddy`

## 4. GitHub repo secrets

Generate a dedicated deploy key on your laptop:

```sh
ssh-keygen -t ed25519 -C "hoeltke-deploy" -f hoeltke_deploy -N ""
```

Put the **public** key (`hoeltke_deploy.pub`) in `/home/deploy/.ssh/authorized_keys` (step 2).
In the GitHub repo → Settings → Secrets and variables → Actions, add:

| Secret              | Value                                  |
| ------------------- | -------------------------------------- |
| `DEPLOY_SSH_KEY`    | contents of the **private** key file   |
| `DEPLOY_HOST`       | server IP or hostname      |
| `DEPLOY_USER`       | `deploy`                               |
| `DEPLOY_PATH`       | `/var/www/hoeltke.com`                 |
| `ANTHROPIC_API_KEY` | API key from console.anthropic.com     |

## 5. DNS

Point the domain at the server:

| Type  | Name | Value              |
| ----- | ---- | ------------------ |
| A     | @    | `<server IPv4>`    |
| AAAA  | @    | `<server IPv6>`    |
| CNAME | www  | `hoeltke.com.`     |

Caddy picks up the certificates automatically once DNS resolves.
Done.

## 6. First deploy

Push to `master` (or run the **Deploy** workflow manually) — the site lands in
`/var/www/hoeltke.com`. Then run the **Weekly digest** workflow once via
*Actions → Weekly digest → Run workflow* to publish the first real issue.
