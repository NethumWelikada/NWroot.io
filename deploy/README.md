# /deploy

This folder contains server configuration for NWroot.io. There is no automatic
deployment script - deployment is done manually, following the setup steps in
the main [README.md](../README.md).

| File | Purpose |
|---|---|
| `apache/000-nwroot-staging.conf` | Apache virtual host config - serves the built frontend and reverse-proxies API + WebSocket traffic to the Node backend |

## Using the Apache Config

```bash
sudo cp deploy/apache/000-nwroot-staging.conf /etc/apache2/sites-available/000-nwroot-staging.conf
sudo a2ensite 000-nwroot-staging.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

Make sure `mod_proxy`, `mod_proxy_http`, and `mod_proxy_wstunnel` are enabled first:

```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite
```

If your server's IP or port differs from what's in the config file, edit the
`<VirtualHost IP:PORT>` line and `ServerName` before copying it in - see the
"Changing the Server IP / Port" section in the main README for the full list
of places that need to match.
