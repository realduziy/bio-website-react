# Portfolio & Profile Hub

This is a personal profile and interactive portfolio website. It features live Discord presence integration, a Spotify-themed recently played showcase, a project catalog, a persistent guestbook, and a secure admin settings dashboard.

> 🛠️ **Co-Created with AI**  
> This application was designed and built with the assistance of Google AI Studio and Gemini models. If you are preparing to deploy this in a production environment, it is recommended to review configuration variables, set custom administrative credentials, and audit the security rules as needed for your setup.

---

## ✨ Features

- **Home & Splash Control**: Clean entry screen containing an epilepsy hazard warning and interactive controls. autoplays background cosmic media (video looping and ambient background music) simultaneously upon activation.
- **Autoplay Autoselection**: Smooth background video (`background.mp4`) and soundtrack track (`background_music.mp3`) managed locally from the `/assets` folder. The server includes automatic downloader scripts to grab fallback media on startup if they are missing or empty.
- **Discord & Spotify Integration**: Displays your live Discord status and Spotify activity in real-time using Lanyard API widgets.
- **Extracted Bios & Socials**: Modular profile records located in a single data module for instant edits.
- **Projects Tab**: Filtering cards showing professional achievements, code repositories, or server specs.
- **Guestbook Tab**: A durable guestbook storing visitor logs and message entries. All fields are sanitized with client side `DOMPurify` before rendering to prevent malicious HTML/JS injection.
- **Admin Dashboard**: Manage and update your linked Discord account ID, Application Client ID, and Client Secret from an active visual UI, authenticated securely using environmental credential verification.
- **IP & Fingerprint Visitor Counter**: Clean, live count in the header tracking all unique page visitors.
- **Robust Express Backend**: Equipped with strict security middlewares (`helmet`, `cors`) and rate limiters on crucial routes to prevent malicious flood attacks or spam.

---

## 📂 Project Structure Map

- **`/server.ts`**: Express backend entry point managing the static server, server-side visitor logs, persistent guestbook entries, rate limiting, secure admin endpoints, and dynamic configurations.
- **`/src/App.tsx`**: Main UI coordinate panel coordinating user navigation, sound/video play states, loading states, and custom cursor configurations.
- **`/src/types.ts`**: TypeScript specifications governing Discord presence activity configurations, guestbook records, and asset payloads.
- **`/src/data/bioData.tsx`**: The exact file where you can modify your social links, nickname, description text, and specific project items.
- **`/src/components/`**:
  * `DiscordPresenceWidget.tsx`: Fetches and processes real-time activity and custom statuses using the Lanyard API websocket endpoints.
  * `RecentlyPlayedWidget.tsx`: Displays current or recently played Spotify tracks.
- **`/src/components/pages/`**:
  * `ProjectsTab.tsx`: Modular projects browser tab with interactive category filtering.
  * `GuestbookTab.tsx`: Secure message submission form and list rendering with local/server persistence.
  * `AdminTab.tsx`: Credentials input dashboard to update configuration settings on the fly.
- **`/src/utils/visitor.ts`**: Minimal, non-invasive client-side visitor identification payload generator.

---

## 🛠️ Local Installation & Development

To run this application locally, ensure you have [Node.js](https://nodejs.org/) installed, then follow these steps:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to a new `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   Provide your fallback defaults:
   - `DEFAULT_DISCORD_ID`: Sets your default Discord Snowflake user ID (e.g., `1025531959736860714`).
   - `ADMIN_USERNAME_HASH`: The administrative username (plaintext or SHA-256 hash) used to sign into the Admin panel (e.g. `admin`).
   - `ADMIN_PASSWORD_HASH`: The administrative password (plaintext or SHA-256 hash) used to sign into the Admin panel (e.g. `MySecurePassword!`).

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to **`http://localhost:3000`**. Changes you make will refresh live in the viewport.

---

## 📝 Personalizing the Content

### Modifying Bios, Social Profiles, and Media Channels
Most of your personal text, project data, and external link tags are separated into **`src/data/bioData.tsx`**. Open this file and edit the main constants directly to customize your brand presence and project statistics.

### Customizing Wallpaper & Ambient Tracks
Open the `/assets` folder at the root directory:
- **`background.mp4`**: Your custom video background.
- **`background_music.mp3`**: The ambient portfolio background track.
- **`custom_cursor.png`**: The PNG texture used for the personalized circular landing cursor locator.

---

## 🐋 Production Deployment (Docker, Nginx & SSL)

This website is designed to build and package easily inside containers or run under traditional proxy wrappers.

### Step A: Deploying via Docker Compose

1. Compile the profile assets build environment and deploy the running container in detached mode:
   ```bash
   docker compose up -d --build
   ```
2. The server is configured inside `docker-compose.yml` to expose the Express engine port cleanly to host port `8000` (or whichever port you choose to map).

### Step B: Reverse Proxying & SSL (Let's Encrypt / Certbot)

For internet-facing servers, proxy requests through Nginx and secure your domain with HTTPS:

1. **Establish Host configuration**:
   Create a virtual host configuration (e.g., `/etc/nginx/sites-available/portfolio`) redirecting to local container port `8000`:
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

2. **Reload Nginx & Certify**:
   Ensure Nginx handles traffic, then run Let's Encrypt to enable TLS certificates:
   ```bash
   sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```
