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
| `OPENROUTER_API_KEY` | API key from openrouter.ai (digest generation)         |

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

## 7. Analytics (optional, no cookies, no JavaScript)

Server-side counting via Caddy access logs + [GoAccess](https://goaccess.io) —
no client-side script, no consent banner needed. Visitor IPs are anonymized
before they're written to disk.

Caddy runs as the `caddy` user, so the log directory — and the log file, if it
already exists — must be owned by it:

```sh
mkdir -p /var/log/caddy
chown -R caddy:caddy /var/log/caddy
apt install -y goaccess
```

Add inside the site block of the Caddyfile:

```caddy
	log {
		output file /var/log/caddy/access.log {
			roll_size 20mb
			roll_keep 3
		}
		format filter {
			wrap json
			fields {
				request>remote_ip ip_mask {
					ipv4 24
					ipv6 56
				}
			}
		}
	}
```

Validate and apply:

```sh
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Confirm logging works — request the site once and check that a JSON line with
a masked IP (`"remote_ip":"x.y.z.0"`) appears:

```sh
curl -s -o /dev/null https://example.com
tail -1 /var/log/caddy/access.log
```

View the dashboard from your own machine:

```sh
ssh -t <user>@<server> goaccess /var/log/caddy/access.log --log-format=CADDY
```

## 8. Newsletter (Resend + subscribe service)

One-time setup for the AI Weekly email pipeline. Sending and contact storage
is [Resend](https://resend.com) (free tier: 3,000 emails/mo, 100/day,
1,000 contacts); the double-opt-in endpoint is a tiny Node service deployed
by CI to `~/subscribe/` and run by systemd.

### Resend account

1. Create a Resend account and add the **subdomain** `mail.hoeltke.com` (not
   the root domain). The newsletter sends from `ai-weekly@mail.hoeltke.com`,
   which keeps its sending reputation isolated from any mail on the root
   domain. Add the DKIM/SPF/MX records Resend shows you — they all live under
   the subdomain, so they never touch the root domain's existing MX/SPF:

   | Record | Host (name) | Notes |
   | ------ | ----------- | ----- |
   | MX     | `send.mail` | Resend's bounce/return-path, value + region from Resend |
   | TXT (SPF)  | `send.mail`          | `v=spf1 include:amazonses.com ~all` |
   | TXT (DKIM) | `resend._domainkey.mail` | the long `p=…` key from Resend |
   | TXT (DMARC, optional) | `_dmarc.mail` | `v=DMARC1; p=none;` |

   Leave every root-level record (apex MX, apex SPF, existing DKIM) untouched —
   that's what protects any mailbox on the root domain. Wait for Resend to mark
   the subdomain **Verified**.
2. Create a segment for subscribers; copy its ID.
3. Create an API key with full access.
4. GitHub repo → Settings → Secrets and variables → Actions:
   add `RESEND_API_KEY` and `RESEND_SEGMENT_ID`. Under *Variables*, optionally
   add `RESEND_REPLY_TO` with the mailbox newsletter replies should reach —
   it lives in repo settings so no personal address sits in the code.
   Delete the old
   `BUTTONDOWN_API_KEY` secret and `PUBLIC_BUTTONDOWN_USERNAME` variable.

### Node on the server

```sh
sudo apt install -y nodejs   # needs Node >= 20; use nodesource if the distro's is older
node --version
```

### Service env + systemd unit

```sh
sudo tee /etc/subscribe.env > /dev/null <<'EOF'
RESEND_API_KEY=re_xxxxxxxx
RESEND_SEGMENT_ID=00000000-0000-0000-0000-000000000000
SUBSCRIBE_HMAC_SECRET=<openssl rand -hex 32>
PORT=8787
EOF
sudo chmod 600 /etc/subscribe.env
```

The service files live under the deploy user's home (`/home/deploy/subscribe/`,
where CI rsyncs them), so the unit runs as `User=deploy` — a systemd
`DynamicUser` gets a transient UID that can't traverse the `750` home directory
to read them. `/etc/systemd/system/subscribe.service` (swap `deploy` for your
deploy user):

```ini
[Unit]
Description=hoeltke.com newsletter subscribe service
After=network.target

[Service]
ExecStart=/usr/bin/node /home/deploy/subscribe/subscribe.mjs
EnvironmentFile=/etc/subscribe.env
User=deploy
Group=deploy
ProtectSystem=strict
ProtectHome=read-only
NoNewPrivileges=yes
PrivateTmp=yes
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
```

The service files only land on the box once the deploy workflow rsyncs
`server/` (or you copy them over manually), so `enable` it now and let the
first deploy start it:

```sh
sudo systemctl daemon-reload
sudo systemctl enable subscribe
# after the files exist (first deploy, or a manual scp):
sudo systemctl start subscribe
curl -s http://127.0.0.1:8787/api/healthz   # → ok
```

Let the CI deploy user restart it (visudo):

```
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart subscribe
```

### Caddy

Add inside the site block of the Caddyfile (Caddy orders `reverse_proxy`
before `file_server` automatically):

```caddy
	reverse_proxy /api/* 127.0.0.1:8787
```

```sh
caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy
curl -s https://hoeltke.com/api/healthz   # → ok
```

### First-send checklist

1. Push to `main` → deploy also rsyncs `server/` and restarts the service.
2. Subscribe yourself on the site → confirmation email arrives (dark) →
   confirm → you land on `/subscribed` → contact appears in the Resend segment.
3. `npm run send-newsletter -- --draft` locally → review the broadcast in the
   Resend dashboard, test-send it to yourself. Check Gmail (light + app dark
   mode — iOS dark fully inverts, verify it stays readable) and Apple Mail
   (light + dark).
4. Delete the draft, then let Friday's workflow do the real send — or run
   `npm run send-newsletter` yourself.
5. Unsubscribe via the footer link of a received email and confirm the
   contact flips to unsubscribed in Resend.
