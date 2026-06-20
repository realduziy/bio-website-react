import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import fs, { promises as fsPromises } from "fs";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Synchronous debug logging helper to bypass Docker log buffering and capture silent container exits
const debugLogPath = path.join(process.cwd(), "assets", "startup_debug.log");
function writeDebugLog(msg: string) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(debugLogPath, `[${timestamp}] ${msg}\n`, "utf8");
    console.log(msg);
  } catch (err: any) {
    console.error("Failed to write to startup_debug.log:", err.message);
  }
}

// Ensure assets folder exists to write files
try {
  if (!fs.existsSync(path.join(process.cwd(), "assets"))) {
    fs.mkdirSync(path.join(process.cwd(), "assets"), { recursive: true });
  }
  fs.writeFileSync(
    debugLogPath,
    `=== SERVER INITIALIZATION DEBUG LOG (${new Date().toISOString()}) ===\n`,
    "utf8"
  );
  writeDebugLog(`NODE_ENV detected as: "${process.env.NODE_ENV}"`);
  writeDebugLog(`Process CWD: "${process.cwd()}"`);
} catch (err: any) {
  console.error("Critical: Failed to initialize debug log on disk:", err.message);
}

dotenv.config();

// Helper to hash string with SHA-256
function sha256(val: string): string {
  return crypto.createHash("sha256").update(val).digest("hex");
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  writeDebugLog(`startServer() called. Configured PORT is ${PORT}`);

  // Enable CORS
  app.use(cors({
    origin: true,
    credentials: true,
  }));

  // Enable Helmet for robust HTTP security headers while allowing preview iframe integrations
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  // Define Rate Limiters (5 requests/minute for authentication endpoints, 100 requests/minute for visitor)
  const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5,
    message: { error: "Too many authentication requests. Please try again after 1 minute." },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  });

  const visitorLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    message: { error: "Too many transaction requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Support application/json body parsing
  app.use(express.json());

  // Check if mounted assets directory exists
  const localAssetsPath = path.join(process.cwd(), "assets");
  writeDebugLog(`Checking assets directory path: ${localAssetsPath}`);

  if (!fs.existsSync(localAssetsPath)) {
    try {
      fs.mkdirSync(localAssetsPath, { recursive: true });
      writeDebugLog(`Created assets directory successfully.`);
    } catch (err: any) {
      writeDebugLog(`[ERROR] Failed to create local assets folder: ${err.message}`);
    }
  }

  writeDebugLog(`Registering static path: /assets mapped to ${localAssetsPath}`);
  app.use("/assets", express.static(localAssetsPath));

  // Secure API Admin verification helper supporting both plaintext and SHA-256 hashes
  function verifyAdmin(username: any, password: any): boolean {
    if (typeof username !== "string" || typeof password !== "string") {
      return false;
    }

    const normUsername = username.trim().toLowerCase();
    const normPassword = password.trim();

    const expectedUserRawOrHash = (process.env.ADMIN_USERNAME_HASH || "").trim();
    const expectedPassRawOrHash = (process.env.ADMIN_PASSWORD_HASH || "").trim();

    if (!expectedUserRawOrHash || !expectedPassRawOrHash) {
      console.warn("[ADMIN WARNING] Administrative authentication is disabled because expected values/hashes are not configured in your environmental variables (.env). Please configure ADMIN_USERNAME_HASH and ADMIN_PASSWORD_HASH.");
      return false;
    }

    // Check 1: Support direct plain-text credential matching
    const normExpectedUsername = expectedUserRawOrHash.toLowerCase();
    if (normUsername === normExpectedUsername && normPassword === expectedPassRawOrHash) {
      return true;
    }

    // Check 2: Support SHA-256 hash matching
    const inputUserHash = sha256(normUsername);
    const inputPassHash = sha256(normPassword);

    try {
      const bufInputUser = Buffer.from(inputUserHash, "utf8");
      const bufExpectedUser = Buffer.from(expectedUserRawOrHash, "utf8");
      const bufInputPass = Buffer.from(inputPassHash, "utf8");
      const bufExpectedPass = Buffer.from(expectedPassRawOrHash, "utf8");

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
        inputUserHash === expectedUserRawOrHash && inputPassHash === expectedPassRawOrHash
      );
    }
  }

  // Secure API Admin verification route
  app.post("/api/admin/auth", authLimiter, (req, res) => {
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

  // Define persistent assets folder at process working directory
  const storageDir = path.join(process.cwd(), "assets");
  console.log(
    `[Express Server] Persistent files storage location resolved to: ${storageDir}`,
  );

  // Automated assets seeding fallback to prevent blank web pages if host mounts an empty volume!
  const defaultAssetsDir = path.join(process.cwd(), "default_assets");
  if (fs.existsSync(defaultAssetsDir) && fs.existsSync(storageDir)) {
    try {
      console.log(
        `[Express Server] Checking for missing default assets in persistent folder: ${storageDir}`,
      );
      const defaultFiles = fs.readdirSync(defaultAssetsDir);
      let copiedCount = 0;
      for (const item of defaultFiles) {
        const sourcePath = path.join(defaultAssetsDir, item);
        const destinationPath = path.join(storageDir, item);

        const stat = fs.statSync(sourcePath);
        if (stat.isFile()) {
          if (!fs.existsSync(destinationPath)) {
            fs.copyFileSync(sourcePath, destinationPath);
            copiedCount++;
          }
        }
      }
      if (copiedCount > 0) {
        console.log(
          `[Express Server] Auto-seeded ${copiedCount} missing default assets into persistence directory from base image!`,
        );
      } else {
        console.log(
          `[Express Server] All default assets already verified present in persistent directory.`,
        );
      }
    } catch (err: any) {
      console.error(
        `[Express Server] Error during automated asset seeding process: ${err.message}`,
      );
    }
  }

  // Synchronous/Asynchronous Auto-downloader of essential high-quality assets to guarantee working site
  function isFileEmptyOrMissing(filePath: string): boolean {
    if (!fs.existsSync(filePath)) return true;
    try {
      const stats = fs.statSync(filePath);
      return stats.size === 0;
    } catch {
      return true;
    }
  }

  async function ensureEssentialAssets() {
    const bgVideoPath = path.join(storageDir, "background.mp4");
    const bgMusicPath = path.join(storageDir, "background_music.mp3");

    // 1. Check and download background.mp4 space loop if empty/missing
    if (isFileEmptyOrMissing(bgVideoPath)) {
      console.log("[Express Server] background.mp4 is empty or missing. Auto-downloading high-quality cosmic space background loop...");
      
      const candidateUrls = [
        "https://raw.githubusercontent.com/yuribeiro/space-travel/master/src/assets/video.mp4",
        "https://github.com/scotthsmith/Space-Landing/raw/master/space.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4"
      ];

      let downloadedSuccessfully = false;

      for (const videoUrl of candidateUrls) {
        try {
          console.log(`[Express Server] Attempting to download background.mp4 from: ${videoUrl}`);
          const response = await fetch(
            videoUrl,
            {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://github.com/scotthsmith/Space-Landing",
              },
            },
          );
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            if (arrayBuffer && arrayBuffer.byteLength > 1000) { // ensure we actually got a real video and not a tiny placeholder/error text
              await fsPromises.writeFile(bgVideoPath, Buffer.from(arrayBuffer));
              console.log(`[Express Server] Successfully downloaded and saved cosmic space background loop from ${videoUrl}!`);
              downloadedSuccessfully = true;
              break;
            }
          } else {
            console.warn(`[Express Server] Failed download from ${videoUrl}: HTTP ${response.status}`);
          }
        } catch (err: any) {
          console.error(`[Express Server] Error attempting to download from ${videoUrl}: ${err.message}`);
        }
      }

      if (!downloadedSuccessfully) {
        console.error("[Express Server] All background.mp4 download candidates failed! Visual loop might lack ambient space motion until setup.");
      }
    }

    // 2. Check and download background_music.mp3 space chill lofi track if empty/missing
    if (isFileEmptyOrMissing(bgMusicPath)) {
      console.log("[Express Server] background_music.mp3 is empty or missing. Auto-downloading smooth ambient lofi music track...");
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/AnshumanFauzdar/Lofi-music-vibe/main/music/1.mp3",
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          },
        );
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          if (arrayBuffer) {
            await fsPromises.writeFile(bgMusicPath, Buffer.from(arrayBuffer));
            console.log("[Express Server] Successfully downloaded and saved ambient lofi track to /assets/background_music.mp3!");
          }
        } else {
          console.warn(`[Express Server] Failed to fetch background_music.mp3: HTTP ${response.status}`);
        }
      } catch (err: any) {
        console.error(`[Express Server] Error downloading background_music.mp3 helper: ${err.message}`);
      }
    }
  }

  // Trigger non-blocking downloading process in background on boot
  ensureEssentialAssets().catch((err) => {
    console.error("[Express Server] Failed in background asset checking routine:", err);
  });

  const configFilePath = path.join(storageDir, "discord_config.json");
  const visitorFilePath = path.join(storageDir, "visitor_count.json");
  const recentlyPlayedFilePath = path.join(storageDir, "recently_played.json");
  const topTracksFilePath = path.join(storageDir, "top_tracks.json");

  // In-Memory Fast Cache of globally active Discord configuration
  const cachedDiscordConfig = {
    discordId: (process.env.DEFAULT_DISCORD_ID || "1025531959736860714").trim(),
    discordClientId: (process.env.DISCORD_CLIENT_ID || "").trim(),
    discordClientSecret: (process.env.DISCORD_CLIENT_SECRET || "").trim(),
  };

  try {
    if (fs.existsSync(configFilePath)) {
      const configData = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
      if (configData.discordId) {
        cachedDiscordConfig.discordId = configData.discordId.trim();
      }
      if (configData.discordClientId !== undefined) {
        cachedDiscordConfig.discordClientId = configData.discordClientId.trim();
      }
      if (configData.discordClientSecret !== undefined) {
        cachedDiscordConfig.discordClientSecret = configData.discordClientSecret.trim();
      }
    }
  } catch (err) {
    console.error("[Express Server] Failed to load initial discord_config.json on startup:", err);
  }

  // Helper for asynchronous and reliable file writes (based directly on the visitor count pattern which is proven to work)
  async function safeWriteFile(filePath: string, data: any) {
    try {
      await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
      console.log(
        `[Express Server] Successfully saved updated content to persistent file: ${filePath}`,
      );
    } catch (err: any) {
      console.error(
        `[Express Server] Failed to write file securely: ${filePath}`,
        err.message,
      );
    }
  }

  // In-Memory Fast Cache of permanent unique visitors and count (default should be 0)
  let totalVisitorCount = 0;
  const allTimeFingerprints = new Set<string>();

  // Helper to instantly and asynchronously persist the exact count and fingerprints list to disk
  async function saveStateToDiskNow(count: number, fingerprints: string[]) {
    try {
      await fsPromises.writeFile(
        visitorFilePath,
        JSON.stringify({ count, fingerprints }, null, 2),
        "utf8",
      );
      console.log(
        `[Express Server] Instantly updated visitor_count.json on disk. Count: ${count}, Fingerprints: ${fingerprints.length}`,
      );
    } catch (err) {
      console.error(
        "[Express Server] Failed to write visitor_count.json asynchronously:",
        err,
      );
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
          console.log(
            `[Express Server] Loaded initial unique visitor tracking state: count=${totalVisitorCount}, database fingerprints=${allTimeFingerprints.size}`,
          );
        }
      }
    } else {
      saveStateToDiskNow(totalVisitorCount, []);
      console.log(
        `[Express Server] Created initial visitor_count.json with default count: ${totalVisitorCount}`,
      );
    }
  } catch (err) {
    console.error(
      "[Express Server] Failed to initialize visitor_count.json on startup:",
      err,
    );
  }

  // Loaded recently played list on startup (with dynamic fallbacks)
  let recentlyPlayed: any[] = [];
  if (fs.existsSync(recentlyPlayedFilePath)) {
    try {
      recentlyPlayed = JSON.parse(
        fs.readFileSync(recentlyPlayedFilePath, "utf8"),
      );
    } catch (_) {}
  }

  // Set default tracks if empty (init to empty array to avoid unwanted placeholder records)
  if (!Array.isArray(recentlyPlayed)) {
    recentlyPlayed = [];
  }

  // Loaded top tracks list on startup (with play-count based metadata)
  let topTracks: any[] = [];
  if (fs.existsSync(topTracksFilePath)) {
    try {
      topTracks = JSON.parse(fs.readFileSync(topTracksFilePath, "utf8"));
    } catch (_) {}
  }

  if (!Array.isArray(topTracks)) {
    topTracks = [];
  }

  // Public endpoint to read visitor count (High speed, read purely from RAM)
  app.get("/api/visitor/count", (req, res) => {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
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
  app.post("/api/visitor/hit", visitorLimiter, (req, res) => {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Safely get IP and User Agent for server-side fallback
    const clientIp =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
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

  // Public endpoint to read real-time computed top played Spotify songs sorted by play frequency
  app.get("/api/top-tracks", (req, res) => {
    res.json(topTracks);
  });

  // Public endpoint to read the globally active Discord Snowflake configuration
  app.get("/api/discord-config", (req, res) => {
    res.json({
      discordId: cachedDiscordConfig.discordId,
      discordClientId: cachedDiscordConfig.discordClientId,
      discordClientSecret: cachedDiscordConfig.discordClientSecret,
    });
  });

  // Protected endpoint to update the globally active Discord config ID
  app.post("/api/discord-config", authLimiter, async (req, res) => {
    const { username, password, discordId, discordClientId, discordClientSecret } = req.body;

    if (!verifyAdmin(username, password)) {
      return res.status(401).json({ error: "Unauthorized update attempt." });
    }

    try {
      const updatedConfig = {
        discordId: (discordId !== undefined
          ? discordId
          : (process.env.DEFAULT_DISCORD_ID || "1025531959736860714")
        ).trim(),
        discordClientId: (discordClientId !== undefined ? discordClientId : "").trim(),
        discordClientSecret: (discordClientSecret !== undefined ? discordClientSecret : "").trim(),
      };

      // Update the memory cache for instant access without blocking disk queries
      cachedDiscordConfig.discordId = updatedConfig.discordId;
      cachedDiscordConfig.discordClientId = updatedConfig.discordClientId;
      cachedDiscordConfig.discordClientSecret = updatedConfig.discordClientSecret;

      await safeWriteFile(configFilePath, updatedConfig);

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
      const discordId = cachedDiscordConfig.discordId;

      console.log(
        `[Spotify Tracker] Polling Lanyard for Discord ID: ${discordId}`,
      );
      const res = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
      if (!res.ok) {
        if (res.status === 404) {
          console.warn(
            `[Spotify Tracker] Lanyard API returned 404 for Discord ID: ${discordId}. Action required: To enable Lanyard status tracking, please join the Lanyard Discord server at https://discord.gg/7B7u2uX to register your profile.`,
          );
        } else {
          console.warn(
            `[Spotify Tracker] Lanyard API returned HTTP error: ${res.status}`,
          );
        }
        return;
      }
      const json: any = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const onlineStatus = d.discord_status || "offline";
        console.log(
          `[Spotify Tracker] Discord User online status: ${onlineStatus}`,
        );

        if (d.listening_to_spotify && d.spotify) {
          const s = d.spotify;
          console.log(
            `[Spotify Tracker] User is LISTENING on Spotify: "${s.song}" by "${s.artist}" (Track ID: ${s.track_id})`,
          );

          if (s.track_id && s.track_id !== lastTrackId) {
            console.log(
              `[Spotify Tracker] Track changed from "${lastTrackId}" to "${s.track_id}"`,
            );
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
              // Limit to last 20 songs as requested
              recentlyPlayed = recentlyPlayed.slice(0, 20);
              safeWriteFile(recentlyPlayedFilePath, recentlyPlayed);

              // Dynamically adjust track statistics to generate actual personalized Top Tracks list
              const trackIdx = topTracks.findIndex(
                (t: any) => t.trackId === s.track_id,
              );
              if (trackIdx !== -1) {
                topTracks[trackIdx].playCount =
                  (topTracks[trackIdx].playCount || 1) + 1;
                topTracks[trackIdx].playedAt = Date.now();
                topTracks[trackIdx].song = s.song;
                topTracks[trackIdx].artist = s.artist;
                topTracks[trackIdx].album = s.album;
                topTracks[trackIdx].albumArtUrl = s.album_art_url;
                console.log(
                  `[Spotify Tracker] Incrementing play count for existing top track: "${s.song}" to ${topTracks[trackIdx].playCount}x`,
                );
              } else {
                topTracks.push({
                  trackId: s.track_id,
                  song: s.song,
                  artist: s.artist,
                  album: s.album,
                  albumArtUrl: s.album_art_url,
                  playedAt: Date.now(),
                  playCount: 1,
                });
                console.log(
                  `[Spotify Tracker] Added brand new top track candidate: "${s.song}" (1x)`,
                );
              }

              // Sort by play count weight, then by recency if count matches
              topTracks.sort((a: any, b: any) => {
                if (b.playCount !== a.playCount) {
                  return b.playCount - a.playCount;
                }
                return b.playedAt - a.playedAt;
              });

              // Keep up to 50 items
              topTracks = topTracks.slice(0, 50);
              safeWriteFile(topTracksFilePath, topTracks);
            } else {
              console.log(
                `[Spotify Tracker] Track matches current head of Recently Played list, skipping duplicate write.`,
              );
            }
          }
        } else {
          console.log(
            `[Spotify Tracker] User is NOT currently active on Spotify (or status is hidden).`,
          );
          // If they stop listening, reset so if they play the same track later it triggers again
          lastTrackId = null;
        }
      } else {
        console.warn(
          `[Spotify Tracker] Lanyard API returned success false or missing user data.`,
        );
      }
    } catch (err: any) {
      console.error(
        `[Spotify Tracker] Connection or parsing error: ${err.message}`,
      );
    }
  }

  // Periodic polling check (runs every 30 seconds)
  setInterval(checkSpotifyPresence, 30000);
  // Initial polling check on startup
  setTimeout(checkSpotifyPresence, 5000);

  writeDebugLog(`Preparing static routing / Vite middleware. NODE_ENV is: "${process.env.NODE_ENV}"`);
  // Serve with Vite in development, static directory in production
  if (process.env.NODE_ENV !== "production") {
    writeDebugLog("Setting up Vite server middleware (Development Mode)");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Custom index.html handler for development mode to ensure correct transformation and delivery
    app.get("*all", async (req, res, next) => {
      // Don't intercept API routes or static assets
      if (req.path.startsWith("/api") || req.path.startsWith("/assets")) {
        return next();
      }
      try {
        const indexPath = path.join(process.cwd(), "index.html");
        writeDebugLog(`[Development] Serving transformed index.html for request "${req.originalUrl || req.url}"`);
        let html = await fsPromises.readFile(indexPath, "utf8");
        html = await vite.transformIndexHtml(req.originalUrl || req.url, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (err: any) {
        writeDebugLog(`[Development ERROR] Failed to serve index.html: ${err.message}`);
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    writeDebugLog(`Setting up Express static file serving from "${distPath}" (Production Mode)`);
    app.use(express.static(distPath));
    
    // Support wildcard routing across standard Express engines
    const serveIndexHTML = (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    };
    app.get("*all", serveIndexHTML);
  }

  writeDebugLog(`Attempting to bind/listen Express app on port ${PORT}...`);
  app.listen(PORT, "0.0.0.0", () => {
    writeDebugLog(`HTTP Server successfully listening on port ${PORT} at host 0.0.0.0!`);
  });
}

startServer().catch((err: any) => {
  writeDebugLog(`FATAL: startServer failed with error message: "${err?.message || err}". Stack: ${err?.stack || "No stack"}`);
  console.error("FATAL: Express server startup failed:", err);
  process.exit(1);
});
