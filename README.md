# My Personal Portfolio & Blog

Hey! Welcome to my personal website and portfolio. It features live Discord status integration, a music tracker that keeps tabs on what I'm listening to (Spotify + Last.fm), a personal blog/logbook, a projects showcase, a guestbook for visitors to leave messages, and an admin panel to manage everything.

> 🛠️ **Built with AI**  
> Just a heads up — this project was co-created using AI! Think of it more as a fun proof of concept and starter template rather than a strict enterprise production app. You should review the code yourself to catch any edge cases or little bugs that might have been missed. I run it live myself and it works great, but as always, deploy and run it in production at your own risk!

---

## ✨ Features

- **Landing Screen**: A splash screen with custom background video and ambient music.
- **24/7 Music Tracking**: Tracks recently played songs and top tracks continuously via Last.fm and Discord/Lanyard.
- **Blog & Logbook**: Built-in blogging system with Markdown support, categories, and post management.
- **Discord & Spotify Status**: Shows live Discord activity and Spotify status in real-time.
- **Projects Showcase**: Filterable showcase for projects, repos, and server specs.
- **Guestbook**: Visitors can sign the guestbook and leave messages safely.
- **Admin Panel**: Easily update blog posts, Discord settings, and music options right from the site.
- **Visitor Counter**: Simple live count of unique page visits in the header.
- **Easy File Persistence**: Everything saved locally (posts, music logs, visitor counts, settings) lives in the `/assets` folder so it's super easy to back up or mount in Docker.

---

## 📂 Where Things Are

- **`server.ts`**: Express backend handling API routes, music sync, blog posts, visitor tracking, and static file serving.
- **`src/App.tsx`**: Main React component managing tabs, audio/video playback, and site state.
- **`src/data/bioData.tsx`**: Edit this file to change your bio, social links, and project list.
- **`src/components/pages/`**: Contains the main page tabs (`ProjectsTab.tsx`, `BlogPage.tsx`, `GuestbookTab.tsx`, `AdminTab.tsx`).
- **`assets/`**: Holds all uploaded media (`background.mp4`, `background_music.mp3`) and JSON data files (`posts.json`, `discord_config.json`, etc.).

---

## 🚀 Getting Started

Got [Node.js](https://nodejs.org/) (v18 or higher) installed? Here's how to get up and running:

1. **Install dependencies**:
   Open a terminal in the project folder and run:
   ```bash
   npm install
   ```

2. **Set up your environment variables**:
   Make a copy of `.env.example` and name it `.env`:
   ```bash
   cp .env.example .env
   ```

   Open `.env` in any text editor and fill in your settings:
   - `PORT`: Port number for the server (defaults to `3000`).
   - `DEFAULT_DISCORD_ID`: Your Discord User ID for live status & Spotify widget tracking.
   - `LASTFM_USERNAME`: *(Optional)* Your Last.fm username if you want 24/7 music scrobble tracking and top tracks.

   ---

   ### 🔐 Setting up your Admin Login (`ADMIN_USERNAME_HASH` & `ADMIN_PASSWORD_HASH`)

   To access the **Admin Panel** on your website (to edit blog posts and settings), set your username and password in `.env`. You can do this in two ways:

   #### Method 1: Plain Text (Quick & Simple)
   Type your chosen username and password directly into `.env`:
   ```env
   ADMIN_USERNAME_HASH=admin
   ADMIN_PASSWORD_HASH=mySecretPassword123
   ```
   *Logging in:* Use `admin` and `mySecretPassword123` on the Admin tab.

   #### Method 2: SHA-256 Hash (Recommended for Better Security)
   Instead of storing your raw password in plain text, you can convert your username and password into a 64-character SHA-256 hash first.

   **How to convert username/password to SHA-256:**
   - **Using Terminal (Linux / Mac / Git Bash):**
     ```bash
     echo -n "admin" | sha256sum
     # Output: 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918

     echo -n "mySecretPassword123" | sha256sum
     # Output: dbd9225d3090967a5f6e2b2f6ef8292f70b43ef8167f082cf61a5e305e717a6a
     ```
   - **Using Online Generators:** Search for "SHA256 generator" online, paste your text, and copy the hash result.

   Put the hash values into `.env`:
   ```env
   ADMIN_USERNAME_HASH=8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
   ADMIN_PASSWORD_HASH=dbd9225d3090967a5f6e2b2f6ef8292f70b43ef8167f082cf61a5e305e717a6a
   ```
   *Logging in:* On the website, you still log in with your normal plain text username (`admin`) and password (`mySecretPassword123`). The server checks the hash automatically.

   ---

3. **Run the site**:
   ```bash
   npm run dev
   ```
   Open your browser and head to **`http://localhost:3000`** to view your live site!

---

## 🎨 Customizing Your Site

- **Edit Bios & Projects**: Open `src/data/bioData.tsx` to update your bio, social media links, and projects.
- **Change Background Video & Music**: Replace `background.mp4` or `background_music.mp3` in the `/assets` folder.
- **Backup Data**: Back up the `/assets` folder to save your blog posts (`posts.json`), settings, and visitor counts.

---

## 🐋 Running in Production (Docker & Nginx)

### With Docker Compose
```bash
docker compose up -d --build
```

### Reverse Proxy with Nginx & Free SSL (Let's Encrypt)

If hosting on a server, point Nginx to port `8000` and enable HTTPS:

1. **Nginx Config** (`/etc/nginx/sites-available/portfolio`):
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

2. **Enable & Enable SSL**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

<img width="1919" height="1079" alt="Screenshot_3" src="https://github.com/user-attachments/assets/ee5dba59-481c-45a7-8c6b-dab328afd2b2" />
<img width="1919" height="1079" alt="Screenshot_9" src="https://github.com/user-attachments/assets/af78d0b1-16e1-4a77-8d2f-cf2828a87586" />
<img width="1919" height="1079" alt="Screenshot_1" src="https://github.com/user-attachments/assets/16bfc997-29e4-435a-b64a-bcc45eb2d8fa" />
<img width="1919" height="1079" alt="Screenshot_2" src="https://github.com/user-attachments/assets/a6e9dbb9-1ebe-403d-b4e9-a92ecb8da92e" />
<img width="1919" height="1079" alt="Screenshot_10" src="https://github.com/user-attachments/assets/834575de-8a6f-4d38-91f7-6d154cb89ab9" />


<img width="1918" height="1079" alt="Screenshot_8" src="https://github.com/user-attachments/assets/a25e1002-2f42-4e29-b99b-3268bc1eaee3" />
<img width="1919" height="1079" alt="Screenshot_7" src="https://github.com/user-attachments/assets/405ad6be-6cd6-44fe-b69b-44c1218a69e7" />
<img width="1916" height="1078" alt="Screenshot_6" src="https://github.com/user-attachments/assets/799385b6-5626-46b8-8d17-45bb9d9cb380" />
<img width="1919" height="1079" alt="Screenshot_5" src="https://github.com/user-attachments/assets/73d52a20-86e0-409f-9617-c42d4d5957e0" />
<img width="1919" height="1079" alt="Screenshot_4" src="https://github.com/user-attachments/assets/bf7891f4-ca2e-4a9c-9887-e9b40c32594b" />

