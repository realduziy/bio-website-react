# 🚀 First-Time Setup & Full Customization Guide

> ⚠️ **AI-Generated Proof-of-Concept Disclaimer**
> *   **AI Crafted:** This entire application was co-created/built with AI.
> *   **Use as a Base:** If you plan to deploy or use this, it is highly recommended to treat it strictly as a **base template/proof of concept** and manually edit, audit, or rewrite parts as needed.
> *   **Potential Edge Cases:** Because this is an experimental proof of concept, there could be security issues or miscellaneous system problems that arise if deployed into sensitive production environments without proper manual code auditing or security hardening.

Premium, high-fidelity personal profile and web portfolio! This is a comprehensive, step-by-step developer and creator manual. 

This guide is structured so you can **edit whatever you want, go wherever you need to in the codebase, and customize every single element** to suit your personal brand, aesthetic choice, and target background environment from scratch.

---

## 🛠️ Step 1: Getting Started (First-Time Setup)

To launch this application locally on your computer for the very first time, make sure you have [Node.js](https://nodejs.org/) installed, and then run these commands in your project root directory:

```bash
# 1. Install all required dependencies
npm install

# 2. Fire up the high-performance local dev server
npm run dev
```

Once executed, open your browser and navigate to **`http://localhost:3000`** to see your portfolio running live. Any edits you make in the code editor will live-reload instantly!

---

## 📝 Step 2: "Edit Whatever, Go Wherever" Customization Guide

Every component has been cleanly designed with high modularity in TypeScript. Here is the full map of where files reside and how to edit them:

### 1. Epilepsy Warning & Entry Controls
*   **Where to go:** `src/App.tsx` (around lines 617-660 & lines 1315-1355)
*   **How it works & customization:**
    *   **Strict Click Restrict:** Entry to the experience is completely restricted to the `'Enter Experience'` button element itself. Clicking on the background wrapper or other elements will not dismiss the splash screen.
    *   **Simultaneous PerfectSync:** When the page loads, both the background loop video and background soundtrack are fully paused at `0.0` seconds. Selecting `'Enter Experience'` triggers `video.play()` and `audio.play()` synchronously inside a bulletproof `try/catch` guard mechanism. This bypasses rigid web browser autoplay restrictions without causing core UI rendering blocks.
    *   **Custom Crosshair Integration:** The custom reticle pointer operates immediately on page load, rendered at a peak configuration layer (`z-index: 20000`) so it hovers smoothly on top of the blacked-out epilepsy welcome layer.

### 2. Configure Discord Settings (Snowflake ID, Client ID & Client Secret)
*   **Where to go:** Your `.env` configuration file, or the interactive **Admin Settings Panel** (accessible directly from your visual interface).
*   **How to customize:**
    *   **Fallback Variables (.env):** Define default credentials in your root `.env` file, or leave them blank/stripped when uploading the source code to GitHub:
        *   `DEFAULT_DISCORD_ID`: Sets the default fallback tracking Snowflake ID (e.g. `1025531959736860714`).
        *   `DISCORD_CLIENT_ID`: (Optional) Your Discord Application Client ID.
        *   `DISCORD_CLIENT_SECRET`: (Optional) Your Discord Application Client Secret.
    *   **Interactive Admin Panel:** Log into the Admin Control Panel in the interface. You can set and save your active Discord ID, Client ID, and Client Secret. These are written safely server-side to `discord_config.json` in your mounted persistent volume, so your code remains completely clean of credentials.
    *   **Typewriter Bios:** Find the `const bioMessages = [...]` array within `src/App.tsx`. You can alter those strings to customize the typing text sequence.

### 3. Customize Your Social & Platform Links
*   **Where to go:** `src/App.tsx`
*   **How to customize:**
    *   Find the layout sections mapping your social profile badges. You can edit the URLs, labels, and icons. For example, search for standard links or buttons like:
        *   `https://github.com/...`
        *   `https://twitch.tv/...`
        *   `https://youtube.com/...`
    *   Replace them with your own channel and profile links. Modify the Tailwind hover classes (e.g., `hover:text-cyan-400` or `hover:border-cyan-500/30`) to match your personal color scheme!

### 4. Alter Your Background Video, Background Audio, & Brand Icons (The `/assets` Folder)
*   **Where to go:** The `/assets` folder at the root of your project directory, or the URLs specified in `src/App.tsx`.
*   **How to customize:**
    *   **Background Live Video Loop:** Put your own `.mp4` video inside the `/assets` folder and name it `background.mp4` (replacing the default). Alternatively, search for the `<video>` tag within `src/App.tsx` and swap the `src` attribute to any hosting URL or another local path.
    *   **Portfolio Soundtrack:** Place an `.mp3` background music loop inside `/assets` and name it `background_music.mp3`. Users can toggle this with the dynamic musical play button on the page! (The ambient player supports volume scaling and play/pause state loops natively).
    *   **Custom Cursor Combat Reticle:** Place a PNG inside `/assets` named `custom_cursor.png` to change the custom cursor design.

### 5. Edit Your "About Me" Specialty Cards & Skills
*   **Where to go:** `src/App.tsx` (Specifically the tabs section under `activeTab === "about"`)
*   **How to customize:**
    *   You are entirely in control of your core grid categories!
    *   Locate the unordered list or grid blocks containing elements like **Minecraft Server**, **Music Production**, **Continuous Learning**, and **Content Creation**.
    *   You can rewrite the labels and tags, swap out Lucide icons (like `<Gamepad />`, `<Music />`, `<Laptop />`, `<Video />`), and write descriptions showing off your creative work, server modifications, specs, or designs.

### 6. Adjust the Modern Top Header (About Me Pill & View Counter)
*   **Where to go:** `src/App.tsx` (The dynamic header component division, around line 1245)
*   **How to customize:**
    *   **About Me Button:** This acts as a streamlined interactive tab switch. Customize its padding and scale using classes like `px-3.5 py-2 text-xs sm:text-xs md:text-xs lg:text-sm`.
    *   **Views Counter Styling:** Fully scales proportionally. Customize its accent color (currently high-contrast cyan `#06b6d4`, change it to any color like rose `#f43f5e`, emerald `#10b981`, or gold `#eab308`). This renders dynamic counts natively out of `/api/visitor/count`.

### 7. Manage Pre-Seeded / Fallback Playback Playlists
*   **Where to go:** `server.ts` (Startup block)
*   **How to customize:**
    *   Locate `let recentlyPlayed: any[] = [];` around line 180.
    *   We pre-seed standard high-quality tracks if cache is empty so you never have empty or glitchy layouts. You can rewrite the pre-seeded songs list array with your target tracks, artist names, albums, and Spotify Album Art covers to make it uniquely yours on launch!

---

## 🐋 Step 3: Production Hosting & Deployment (Full Details)

Once you've made your edits, you can launch it in a production environment (like a Virtual Private Server / VPS) using Docker or a traditional web proxy.

### A. The Docker Road (Recommended)

Docker packages all files, servers, and configurations into a single sandboxed container.

#### 1. Setup Your Environmental Variables (`.env`)
Before continuing, create a `.env` file in your root folder based on `.env.example`:
```bash
cp .env.example .env
```
Fill out your administrative and integration credentials:
*   `ADMIN_USERNAME_HASH`: Put either your plain-text administrative username (e.g. `admin`) or its SHA-256 hash.
*   `ADMIN_PASSWORD_HASH`: Put either your plain-text administrative password (e.g. `MySecurePassword!`) or its SHA-256 hash.
*   `DEFAULT_DISCORD_ID`: Your Discord User Snowflake ID (e.g. `1025531959736860714`).
*   `DISCORD_CLIENT_ID`: (Optional) Your Discord application Client ID.
*   `DISCORD_CLIENT_SECRET`: (Optional) Your Discord application Client Secret.

*Note: Your `.env` containing administrative credentials should be kept private and never uploaded to public GitHub repositories!*

#### 2. Setup Your Docker Compose
Your `docker-compose.yml` file is configured as follows for maximum reliability:
```yaml
services:
  website-test:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: website_test
    env_file:
      - .env
    ports:
      # Map host port 8000 (or whichever you proxy to from your VPS Nginx)
      # to container port 3000 where our Express server listens.
      - "127.0.0.1:8000:3000"
    restart: always
    volumes:
      # Map direct VPS asset paths to your container to persist data across container restarts and builds
      - ./assets:/app/assets
```

#### 3. Run the Container
```bash
# Build the production assets container and let it run in the background
docker compose up -d --build
```
Your production profile portfolio is now live on port `8000` locally!

---

### B. Configuring Custom Domain & SSL (HTTPS)

To wire up your domain (e.g., `yourdomain.com`) and secure it with a free SSL certificate from Let's Encrypt:

#### 1. Create NGINX Configuration File on your host VPS:
Create or edit `/etc/nginx/sites-available/default`:
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

#### 2. Apply and Secure with Certbot (HTTPS)
```bash
# Test configurations and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

# Install Let's Encrypt Certbot
sudo apt install certbot python3-certbot-nginx

# Request and configure your SSL certificates automatically
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
