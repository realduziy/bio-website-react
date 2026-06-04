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

### 1. Change Your Discord ID, Username, and Typewriter Bio
*   **Where to go:** `src/App.tsx`
*   **How to customize:**
    *   **Discord User ID (For Presence Sync):** Locate `const discordId = "..."` at the top of the file (usually around line 125). Change this string to your developer Discord User ID to automatically stream your live Status (Online, Idle, DND) and status badges!
    *   **Typewriter Bios:** Find the `const bioMessages = [...]` array around line 167. You can add, edit, or remove strings inside this list to customize the text that automatically types out on your landing screen.
    *   **Title/Header Text:** In the component layout, you can edit the instances of `duziy` or your custom handle directly within the paragraph files inside the main profile block.

### 2. Customize Your Social & Platform Links
*   **Where to go:** `src/App.tsx`
*   **How to customize:**
    *   Find the layout sections mapping your social profile badges. You can edit the URLs, labels, and icons. For example, search for standard links or buttons like:
        *   `https://github.com/...`
        *   `https://twitch.tv/...`
        *   `https://youtube.com/...`
    *   Replace them with your own channel and profile links. Modify the Tailwind hover classes (e.g., `hover:text-cyan-400` or `hover:border-cyan-500/30`) to match your personal color scheme!

### 3. Alter Your Background Video, Background Audio, & Brand Icons (The `/assets` Folder)
*   **Where to go:** The `/assets` folder at the root of your project directory, or the URLs specified in `src/App.tsx`.
*   **How to customize:**
    *   **Background Live Video Loop:** Put your own `.mp4` video inside the `/assets` folder and name it `background.mp4` (replacing the default). Alternatively, search for the `<video>` tag within `src/App.tsx` and swap the `src` attribute to any hosting URL or another local path.
    *   **Portfolio Soundtrack:** Place an `.mp3` background music loop inside `/assets` and name it `background_music.mp3`. Users can toggle this with the dynamic musical play button on the page! (The ambient player supports volume scaling and play/pause state loops natively).
    *   **Custom Cursor Combat Reticle:** Place a PNG inside `/assets` named `custom_cursor.png` to change the custom cursor design.

### 4. Edit Your "About Me" Specialty Cards & Skills
*   **Where to go:** `src/App.tsx` (Specifically the tabs section under `activeTab === "about"`)
*   **How to customize:**
    *   You are entirely in control of your core grid categories!
    *   Locate the unordered list or grid blocks containing elements like **Minecraft Server**, **Music Production**, **Continuous Learning**, and **Content Creation**.
    *   You can rewrite the labels and tags, swap out Lucide icons (like `<Gamepad />`, `<Music />`, `<Laptop />`, `<Video />`), and write descriptions showing off your creative work, server modifications, specs, or designs.

### 5. Adjust the Modern Top Header (About Me Pill & View Counter)
*   **Where to go:** `src/App.tsx` (The dynamic header component division, around line 1245)
*   **How to customize:**
    *   **About Me Button:** This acts as a streamlined interactive tab switch. Customize its padding and scale using classes like `px-3.5 py-2 text-xs sm:text-xs md:text-xs lg:text-sm`.
    *   **Views Counter Styling:** Fully scales proportionally. Customize its accent color (currently high-contrast cyan `#06b6d4`, change it to any color like rose `#f43f5e`, emerald `#10b981`, or gold `#eab308`). This renders dynamic counts natively out of `/api/visitor/count`.

### 6. Manage Pre-Seeded / Fallback Playback Playlists
*   **Where to go:** `server.ts` (Startup block)
*   **How to customize:**
    *   Locate `let recentlyPlayed: any[] = [];` around line 180.
    *   We pre-seed standard high-quality tracks if cache is empty so you never have empty or glitchy layouts. You can rewrite the pre-seeded songs list array with your target tracks, artist names, albums, and Spotify Album Art covers to make it uniquely yours on launch!

---

## 🐋 Step 3: Production Hosting & Deployment (Full Details)

Once you've made your edits, you can launch it in a production environment (like a Virtual Private Server / VPS) using Docker or a traditional web proxy.

### A. The Docker Road (Recommended)

Docker packages all files, servers, and configurations into a single sandboxed container.

#### 1. Setup Your Docker Compose
Create a `docker-compose.yml` file in your project directory:
```yaml
services:
  website-bio:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: website_prod
    restart: always
    ports:
      - "127.0.0.1:8000:3000"
    volumes:
      - ./assets:/usr/share/nginx/html/assets
```

#### 2. Run the Container
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
<img width="1913" height="878" alt="image" src="https://github.com/user-attachments/assets/93c3747e-0e61-476f-9f1b-5072e12e4471" />
<img width="1908" height="882" alt="image" src="https://github.com/user-attachments/assets/6744b6f1-9deb-4352-b4bc-b4bcfd343f46" />
<img width="1913" height="884" alt="image" src="https://github.com/user-attachments/assets/4f656825-d300-41a3-96e1-3dbfcad52d16" />
<img width="1915" height="958" alt="image" src="https://github.com/user-attachments/assets/3b4c0b63-67f5-4876-b957-f44b4fe8bc20" />
<img width="1916" height="891" alt="image" src="https://github.com/user-attachments/assets/8a2fbf77-0c79-4f0c-b178-773ccce90238" />





