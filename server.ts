import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";

dotenv.config();

// Helper to hash string with SHA-256
function sha256(val: string): string {
  return crypto.createHash("sha256").update(val).digest("hex");
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Support application/json body parsing
  app.use(express.json());

  // Check if mounted assets directory exists (such as from previous nginx structures mapped via docker-compose)
  const externalAssetsPath = "/usr/share/nginx/html/assets";
  const localAssetsPath = path.join(process.cwd(), "assets");

  if (fs.existsSync(externalAssetsPath)) {
    console.log(
      `[Express Server] Serving assets from external container volume: ${externalAssetsPath}`,
    );
    app.use("/assets", express.static(externalAssetsPath));
  } else if (fs.existsSync(localAssetsPath)) {
    console.log(
      `[Express Server] Serving assets from local directory: ${localAssetsPath}`,
    );
    app.use("/assets", express.static(localAssetsPath));
  }

  // Secure API Admin verification helper using cryptographic hash comparison
  function verifyAdmin(username: any, password: any): boolean {
    if (typeof username !== "string" || typeof password !== "string") {
      return false;
    }

    const normUsername = username.trim().toLowerCase();
    const normPassword = password.trim();

    // Default hashes correspond to username: duziydev / password: EAJBN)(*&UDF
    let expectedUserHash = (process.env.ADMIN_USERNAME_HASH || "").trim();
    let expectedPassHash = (process.env.ADMIN_PASSWORD_HASH || "").trim();

    if (!expectedUserHash || expectedUserHash.length !== 64) {
      expectedUserHash =
        "01d370f6ec03e7742d5c5fccc6e5529d27ccf4eb207ba308fe327e61049baf11";
    }
    if (!expectedPassHash || expectedPassHash.length !== 64) {
      expectedPassHash =
        "898deff28174fa0f9fa08cae92166d40e1c10f54c554f05d9ae6ff31fd0dd07d";
    }

    const inputUserHash = sha256(normUsername);
    const inputPassHash = sha256(normPassword);

    try {
      const bufInputUser = Buffer.from(inputUserHash, "utf8");
      const bufExpectedUser = Buffer.from(expectedUserHash, "utf8");
      const bufInputPass = Buffer.from(inputPassHash, "utf8");
      const bufExpectedPass = Buffer.from(expectedPassHash, "utf8");

      if (
        bufInputUser.length !== bufExpectedUser.length ||
        bufInputPass.length !== bufExpectedPass.length
      ) {
        return false;
      }

      const uMatch = crypto.timingSafeEqual(bufInputUser, bufExpectedUser);
      const pMatch = crypto.timingSafeEqual(bufInputPass, bufExpectedPass);
      return uMatch && pMatch;
    } catch {
      return (
        inputUserHash === expectedUserHash && inputPassHash === expectedPassHash
      );
    }
  }

  // Secure API Admin verification route
  app.post("/api/admin/auth", (req, res) => {
    let { username, password } = req.body;
    if (verifyAdmin(username, password)) {
      res.json({ authenticated: true });
    } else {
      res.status(401).json({
        authenticated: false,
        error: "Unauthorized Administrative access token or passcode mismatch",
      });
    }
  });

  // Find the safest persistent storage directory (either the mounted docker assets volume, or local assets directory, or fallback to current working directory)
  function getStorageDir(): string {
    const externalAssetsPath = "/usr/share/nginx/html/assets";
    const localAssetsPath = path.join(process.cwd(), "assets");
    if (fs.existsSync(externalAssetsPath)) {
      return externalAssetsPath;
    } else if (fs.existsSync(localAssetsPath)) {
      return localAssetsPath;
    }
    return process.cwd();
  }

  const storageDir = getStorageDir();
  console.log(`[Express Server] Persistent files storage location resolved to: ${storageDir}`);

  const configFilePath = path.join(storageDir, "discord_config.json");
  const visitorFilePath = path.join(storageDir, "visitor_count.json");
  const recentlyPlayedFilePath = path.join(storageDir, "recently_played.json");

  // Helper for non-blocking asynchronous file writes
  async function safeWriteFile(filePath: string, data: any) {
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
      console.error(`[Express Server] Failed to write file asynchronously: ${filePath}`, err);
    }
  }

  // In-Memory Fast Cache of permanent unique visitors and count (default should be 0)
  let totalVisitorCount = 0;
  const allTimeFingerprints = new Set<string>();

  // Helper to instantly and synchronously persist the exact count and fingerprints list to disk
  function saveStateToDiskNow(count: number, fingerprints: string[]) {
    try {
      fs.writeFileSync(
        visitorFilePath,
        JSON.stringify({ count, fingerprints }, null, 2),
        "utf8"
      );
      console.log(`[Express Server] Instantly updated visitor_count.json on disk. Count: ${count}, Fingerprints: ${fingerprints.length}`);
    } catch (err) {
      console.error("[Express Server] Failed to write visitor_count.json synchronously:", err);
    }
  }

  function generateFingerprint(ip: string, userAgent: string): string {
    const data = `${ip}-${userAgent}`;
    return sha256(data);
  }

  // Load and initialize visitor count and all-time fingerprints in RAM once on startup
  try {
    if (fs.existsSync(visitorFilePath)) {
      const fileData = fs.readFileSync(visitorFilePath, "utf8").trim();
      if (fileData) {
        const parsed = JSON.parse(fileData);
        if (typeof parsed === "object" && parsed !== null) {
          if (typeof parsed.count === "number") {
            totalVisitorCount = parsed.count;
          }
          if (Array.isArray(parsed.fingerprints)) {
            parsed.fingerprints.forEach((fp: string) => {
              if (fp && typeof fp === "string") {
                allTimeFingerprints.add(fp);
              }
            });
          }
          // Ensure count represents at least the size of stored unique visitors
          if (allTimeFingerprints.size > totalVisitorCount) {
            totalVisitorCount = allTimeFingerprints.size;
          }
          console.log(`[Express Server] Loaded initial unique visitor tracking state: count=${totalVisitorCount}, database fingerprints=${allTimeFingerprints.size}`);
        }
      }
    } else {
      saveStateToDiskNow(totalVisitorCount, []);
      console.log(`[Express Server] Created initial visitor_count.json with default count: ${totalVisitorCount}`);
    }
  } catch (err) {
    console.error("[Express Server] Failed to initialize visitor_count.json on startup:", err);
  }

  // Loaded recently played list on startup (with dynamic fallbacks)
  let recentlyPlayed: any[] = [];
  if (fs.existsSync(recentlyPlayedFilePath)) {
    try {
      recentlyPlayed = JSON.parse(fs.readFileSync(recentlyPlayedFilePath, "utf8"));
    } catch (_) {}
  }

  // Pre-seed default tracks if empty to ensure the widget is always fully functional and populated
  if (!Array.isArray(recentlyPlayed) || recentlyPlayed.length === 0) {
    recentlyPlayed = [
      {
        trackId: "4ptb6vQvH03gA6u03T6HhX",
        song: "Minecraft",
        artist: "C418",
        album: "Minecraft - Volume Alpha",
        albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273910c2e91244ab9f7fae94e5b",
        playedAt: Date.now() - 3600000 * 2, // 2h ago
      },
      {
        trackId: "3U4isOI3Y9gIrsxZnb97gB",
        song: "Sweden",
        artist: "C418",
        album: "Minecraft - Volume Alpha",
        albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273910c2e91244ab9f7fae94e5b",
        playedAt: Date.now() - 3600000 * 5, // 5h ago
      },
      {
        trackId: "598950S5fPvT9RLg8rE949",
        song: "Wet Hands",
        artist: "C418",
        album: "Minecraft - Volume Alpha",
        albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273910c2e91244ab9f7fae94e5b",
        playedAt: Date.now() - 3600000 * 12, // 12h ago
      }
    ];
    safeWriteFile(recentlyPlayedFilePath, recentlyPlayed);
  }

  // Public endpoint to read visitor count (High speed, read purely from RAM)
  app.get("/api/visitor/count", (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json({
      count: totalVisitorCount,
      liveConnected: allTimeFingerprints.size,
      resolvedPath: visitorFilePath,
      cwd: process.cwd(),
    });
  });

  // Unique visitor hit endpoint with server-side hashing fallback and client fingerprint payload
  app.post("/api/visitor/hit", (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    // Safely get IP and User Agent for server-side fallback
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const ipString = Array.isArray(clientIp) ? clientIp[0] : String(clientIp);
    const ip = ipString.split(",")[0].trim();
    const ua = req.headers["user-agent"] || "unknown";

    // Grab the fingerprint from client payload if provided, fallback to standard sha256 hash
    let fingerprint = req.body?.fp;
    if (typeof fingerprint !== "string" || !fingerprint) {
      fingerprint = generateFingerprint(ip, ua);
    }

    // If fingerprint is completely brand new to the all-time persistent unique list, increment and write instantly
    if (!allTimeFingerprints.has(fingerprint)) {
      allTimeFingerprints.add(fingerprint);
      totalVisitorCount += 1;
      
      // Save synchronously to disk immediately - no delay, no buffers, no overlapping process races, fully reliable!
      saveStateToDiskNow(totalVisitorCount, Array.from(allTimeFingerprints));
    }
    
    res.json({
      count: totalVisitorCount,
      liveConnected: allTimeFingerprints.size,
      resolvedPath: visitorFilePath,
      cwd: process.cwd(),
    });
  });

  // Public endpoint to read recently played Spotify songs
  app.get("/api/recently-played", (req, res) => {
    res.json(recentlyPlayed);
  });

  // Public endpoint to read the globally active Discord Snowflake configuration
  app.get("/api/discord-config", (req, res) => {
    try {
      if (fs.existsSync(configFilePath)) {
        const configData = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
        return res.json({
          discordId: configData.discordId || "1025531959736860714",
        });
      }
    } catch (err) {
      console.error("Error reading discord_config.json:", err);
    }
    res.json({
      discordId: "1025531959736860714",
    });
  });

  // Protected endpoint to update the globally active Discord config ID
  app.post("/api/discord-config", (req, res) => {
    const { username, password, discordId } = req.body;

    if (!verifyAdmin(username, password)) {
      return res.status(401).json({ error: "Unauthorized update attempt." });
    }

    try {
      const updatedConfig = {
        discordId: (discordId !== undefined ? discordId : "1025531959736860714").trim(),
      };

      safeWriteFile(
        configFilePath,
        updatedConfig,
      );

      res.json({
        success: true,
        message: "Discord Snowflake ID saved globally on server!",
      });

      // Instantly trigger polling check on save to update presence right away
      checkSpotifyPresence();
    } catch (err: any) {
      console.error("Error writing discord_config.json:", err);
      res
        .status(500)
        .json({ error: "Failed to persist configuration server-side." });
    }
  });

  // Dynamic status polling system to track recently played Spotify songs
  let lastTrackId: string | null = null;
  async function checkSpotifyPresence() {
    try {
      let discordId = "1025531959736860714";
      if (fs.existsSync(configFilePath)) {
        try {
          const configData = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
          if (configData.discordId) discordId = configData.discordId.trim();
        } catch (_) {}
      }

      const res = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
      if (!res.ok) return;
      const json: any = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        if (d.listening_to_spotify && d.spotify) {
          const s = d.spotify;
          if (s.track_id && s.track_id !== lastTrackId) {
            lastTrackId = s.track_id;

            // Check if it's already the most recently added song
            const mostRecent = recentlyPlayed[0];
            if (!mostRecent || mostRecent.trackId !== s.track_id) {
              const newTrack = {
                trackId: s.track_id,
                song: s.song,
                artist: s.artist,
                album: s.album,
                albumArtUrl: s.album_art_url,
                playedAt: Date.now(),
              };
              recentlyPlayed.unshift(newTrack);
              // Limit to last 15 songs
              recentlyPlayed = recentlyPlayed.slice(0, 15);
              safeWriteFile(recentlyPlayedFilePath, recentlyPlayed);
            }
          }
        } else {
          // If they stop listening, reset so if they play the same track later it triggers again
          lastTrackId = null;
        }
      }
    } catch (err) {
      // Safe offline fallback
    }
  }

  // Periodic polling check (runs every 30 seconds)
  setInterval(checkSpotifyPresence, 30000);
  // Initial polling check on startup
  setTimeout(checkSpotifyPresence, 5000);

  // Serve with Vite in development, static directory in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
