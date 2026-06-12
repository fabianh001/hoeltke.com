# Server setup (one-time)

The site is plain static files served by [Caddy](https://caddyserver.com) (automatic HTTPS).
GitHub Actions rsyncs `dist/` to the server on every push to `main`.

Works on any small Linux VPS — the cheapest instance at any provider is more than
enough for a static site. Requirements:

- Debian or Ubuntu (other distros work too; adjust the Caddy install)
- inbound TCP 22, 80 **and** 443 (80 is required for the TLS certificate challenge)
- both IPv4 and IPv6 if possible — note that GitHub-hosted runners can only reach
  IPv4, so an IPv6-only server cannot receive deploys
- DNS control for your domain

## 1. Install Caddy (Debian/Ubuntu)

```sh
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

## 2. Create an unprivileged deploy user and the webroot

The CI job logs in as this user — it should own the webroot and nothing else.
Names and paths are examples; whatever you choose goes into the repo secrets in step 4.

```sh
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /var/www/site
sudo chown -R deploy:deploy /var/www/site

sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy chmod 700 /home/deploy/.ssh
echo "<PUBLIC KEY FROM STEP 4>" | sudo -u deploy tee /home/deploy/.ssh/authorized_keys
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys
```

## 3. Caddyfile

Replace `/etc/caddy/Caddyfile` (swap in your domain and webroot):

```caddy
example.com {
	root * /var/www/site
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

www.example.com {
	redir https://example.com{uri} permanent
}
```

Then: `sudo systemctl reload caddy`

## 4. Deploy key and GitHub repo secrets

Generate a dedicated keypair on your own machine — never reuse your personal key for CI:

```sh
ssh-keygen -t ed25519 -C "site-deploy" -f site_deploy -N ""
```

Put the **public** key (`site_deploy.pub`) into the deploy user's
`authorized_keys` (step 2). In the GitHub repo → Settings → Secrets and
variables → Actions, add:

| Secret              | Value                                   |
| ------------------- | --------------------------------------- |
| `DEPLOY_SSH_KEY`    | contents of the **private** key file    |
| `DEPLOY_HOST`       | server IP or hostname                   |
| `DEPLOY_USER`       | the user from step 2 (e.g. `deploy`)    |
| `DEPLOY_PATH`       | the webroot from step 2                 |
| `ANTHROPIC_API_KEY` | API key from console.anthropic.com (digest generation) |

## 5. DNS

At your DNS provider, point the domain at the server:

| Type  | Name | Value           |
| ----- | ---- | --------------- |
| A     | @    | `<server IPv4>` |
| AAAA  | @    | `<server IPv6>` |
| CNAME | www  | `example.com.`  |

Caddy obtains and renews certificates automatically once DNS resolves —
no certbot, no cron.

## 6. First deploy

Push to `main` (or run the **Deploy** workflow manually). Then run the
**Weekly digest** workflow once via *Actions → Weekly digest → Run workflow*
to publish the first issue.
