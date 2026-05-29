# duziy Profile - Setup & Deployment Guide

This is a premium, high-fidelity profile portfolio website built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**, designed to support looping background media, dynamic crosshairs, and a fully synced audio system.

The application is containerized with **Docker** and served through **NGINX** (supporting single-page app formatting and routing fallbacks). This setup is ideal for VPS hosting or local staging on Docker environments.

---

## 🛠️ Setup & Customization Guide

### 1. Customizing Media Assets
Place your branding and atmospheric assets inside the `/assets` folder:
* **Profile Photo:** Replace `/assets/profile.jpg` (or SVG initials fallback will display beautifully).
* **Atmospheric Video:** Add `/assets/background.mp4` for a moving dark canvas video.
* **Background Soundtrack:** Insert `/assets/background_music.mp3` to loop serene space ambient audio.
* **Cursor Reticle:** Drop `/assets/custom_cursor.png` to define your custom cursor crosshairs (renders a precise CSS combat reticle fallback on failure).
* **Favicon:** Use `/assets/favicon.ico` for your browser tab identity.

### 2. Live Content Modifications
Open `/src/App.tsx` and adjust state definitions directly:
* **Typewriter Bio:** Modify `bioMessages` array around line 167 to alter your typewriter headings.
* **Social Connections:** Customize `socialLinks` grid list starting around line 330 with your respective profile links and icons.

---

## 🚀 Production Deployment & Execution

This project is packaged with a multi-stage `Dockerfile` and a simple `docker-compose.yml` to build static assets and run them securely in isolated environments.

### 🐳 Running with Docker & Compose (Recommended for VPS)

Using Docker Compose is the most robust way to deploy and host this web portfolio.

#### Step 1: Create a `docker-compose.yml` file
Run `nano docker-compose.yml` on your server and enter:
```yaml
services:
  website-bio:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: website_prod
    restart: always
    ports:
      - "127.0.0.1:8000:80"
    volumes:
      - ./assets:/usr/share/nginx/html/assets
```
> ⚠️ **Note on Ports:** Mapped as `"127.0.0.1:8000:80"` to securely isolate native port access behind a server reverse proxy (like Nginx). To bind public port 80 directly with no proxy, configure as `"80:80"`.

#### Step 2: Assemble and Run the Container
Execute the following container command in your workspace directory:
```bash
docker compose up -d --build
```
* **Verify active container:** `docker ps`
* **Stop active container:** `docker compose down`
* **Monitor Nginx logs:** `docker logs -f website_prod`

---

## 🌐 Connecting Domain & SSL Cerfiticates (Let's Encrypt)

Secure your deployment with HTTPS by setting up an external reverse proxy on your Linux host.

### Nginx Host Configuration:
1. Map your domain registrar's **A Record** to your VPS public IPv4 Address.
2. Edit your local host's secure site configuration under `/etc/nginx/sites-available/default`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
3. Test your Nginx configuration with `sudo nginx -t` and reload using `sudo systemctl reload nginx`.
4. Procure security certificates with Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 💻 Local Workspace Development

To review code modifications on your native desktop workstation before pushing them to live:

```bash
# 1. Install workspace environment modules
npm install

# 2. Fire up the high performance local dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your modifications instantly.
