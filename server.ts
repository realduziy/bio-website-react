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
  // Enable trust proxy so express-rate-limit correctly handles reverse proxy headers (Cloud Run, Nginx, etc.)
  app.set("trust proxy", 1);
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
  function verifyAdmin(username: unknown, password: unknown): boolean {
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

    // Clean up any zero-byte empty files first to prevent range satisfiable serving errors
    for (const p of [bgVideoPath, bgMusicPath]) {
      try {
        if (fs.existsSync(p) && fs.statSync(p).size === 0) {
          fs.unlinkSync(p);
          console.log(`[Express Server] Deleted empty zero-byte file to prevent range errors: ${p}`);
        }
      } catch (err: any) {
        console.error(`[Express Server] Error deleting zero-byte file ${p}: ${err.message}`);
      }
    }

    // 1. Check and download background.mp4 space loop if empty/missing
    if (isFileEmptyOrMissing(bgVideoPath)) {
      console.log("[Express Server] background.mp4 is empty or missing. Auto-downloading high-quality cosmic space background loop...");

      const candidateUrls = [
        "https://vjs.zencdn.net/v/oceans.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
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
        try {
          if (fs.existsSync(bgVideoPath) && fs.statSync(bgVideoPath).size === 0) {
            fs.unlinkSync(bgVideoPath);
          }
        } catch {}
      }
    }

    // 2. Check and download background_music.mp3 space chill lofi track if empty/missing
    if (isFileEmptyOrMissing(bgMusicPath)) {
      console.log("[Express Server] background_music.mp3 is empty or missing. Auto-downloading smooth ambient lofi music track...");

      const musicCandidates = [
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
      ];

      let musicDownloaded = false;

      for (const musicUrl of musicCandidates) {
        try {
          console.log(`[Express Server] Attempting to download background_music.mp3 from: ${musicUrl}`);
          const response = await fetch(
            musicUrl,
            {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              },
            },
          );
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            if (arrayBuffer && arrayBuffer.byteLength > 1000) {
              await fsPromises.writeFile(bgMusicPath, Buffer.from(arrayBuffer));
              console.log(`[Express Server] Successfully downloaded and saved ambient lofi track from ${musicUrl}!`);
              musicDownloaded = true;
              break;
            }
          } else {
            console.warn(`[Express Server] Failed to fetch background_music.mp3 from ${musicUrl}: HTTP ${response.status}`);
          }
        } catch (err: any) {
          console.error(`[Express Server] Error downloading background_music.mp3 from ${musicUrl}: ${err.message}`);
        }
      }

      if (!musicDownloaded) {
        console.error("[Express Server] All background_music.mp3 download candidates failed!");
        try {
          if (fs.existsSync(bgMusicPath) && fs.statSync(bgMusicPath).size === 0) {
            fs.unlinkSync(bgMusicPath);
          }
        } catch {}
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

  // In-Memory Fast Cache of globally active Discord & Music configuration
  const cachedDiscordConfig = {
    discordId: (process.env.DEFAULT_DISCORD_ID || "1025531959736860714").trim(),
    discordClientId: (process.env.DISCORD_CLIENT_ID || "").trim(),
    discordClientSecret: (process.env.DISCORD_CLIENT_SECRET || "").trim(),
    lastfmUsername: (process.env.LASTFM_USERNAME || "").trim(),
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
      if (configData.lastfmUsername !== undefined) {
        cachedDiscordConfig.lastfmUsername = configData.lastfmUsername.trim();
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

  // Public endpoint to read recently played Spotify / Last.fm songs
  app.get("/api/recently-played", async (req, res) => {
    try {
      await syncMusicTracks();
    } catch (e) {}
    res.json(recentlyPlayed);
  });

  // Public endpoint to read real-time computed top played songs sorted by play frequency
  app.get("/api/top-tracks", async (req, res) => {
    try {
      await syncMusicTracks();
    } catch (e) {}
    res.json(topTracks);
  });


  // Helper to generate a unique url-safe slug from title
  function generateSlug(title: string, existingSlugs: string[]): string {
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    if (!slug) {
      slug = "post";
    }

    let finalSlug = slug;
    let counter = 1;
    while (existingSlugs.includes(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
    return finalSlug;
  }

  const postsFilePath = path.join(storageDir, "posts.json");

  // Helper to read posts from file in a fully asynchronous, non-blocking manner
  async function readPostsFromFile(): Promise<any[]> {
    try {
      const fileContent = await fsPromises.readFile(postsFilePath, "utf8");
      const parsed = JSON.parse(fileContent);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        console.error("[Blog Backend] Failed to read or parse posts.json:", err);
      }
    }
    return [];
  }

  // Public: Get all posts
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await readPostsFromFile();
      const showAll = req.query.all === "true";
      const username = req.query.username;
      const password = req.query.password;

      let isAdmin = false;
      if (showAll && username && password) {
        isAdmin = verifyAdmin(username, password);
      }

      // Sort posts by newest first
      const sorted = [...posts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      if (isAdmin) {
        res.json(sorted);
      } else {
        res.json(sorted.filter(p => p.isPublished));
      }
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load posts" });
    }
  });

  // Public: Get post by slug
  app.get("/api/posts/:slug", async (req, res) => {
    try {
      const posts = await readPostsFromFile();
      const post = posts.find(p => p.slug === req.params.slug);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load post" });
    }
  });

  // Admin: Create new post
  app.post("/api/posts", authLimiter, async (req, res) => {
    const { username, password, title, summary, coverImageUrl, content, isPublished } = req.body;

    if (!verifyAdmin(username, password)) {
      return res.status(401).json({ error: "Unauthorized update attempt." });
    }

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Title is required and must be a string." });
    }

    try {
      const posts = await readPostsFromFile();
      const existingSlugs = posts.map(p => p.slug);
      const slug = generateSlug(title, existingSlugs);

      const newPost = {
        id: "post-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
        title: title.trim(),
        slug,
        summary: (summary || "").trim(),
        coverImageUrl: (coverImageUrl || "").trim(),
        content: (content || "").trim(),
        isPublished: !!isPublished,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      posts.push(newPost);
      await safeWriteFile(postsFilePath, posts);

      res.status(201).json(newPost);
    } catch (err: any) {
      console.error("[Blog Backend] Error creating post:", err);
      res.status(500).json({ error: "Failed to save blog post" });
    }
  });

  // Admin: Update post
  app.put("/api/posts/:id", authLimiter, async (req, res) => {
    const { username, password, title, summary, coverImageUrl, content, isPublished } = req.body;
    const { id } = req.params;

    if (!verifyAdmin(username, password)) {
      return res.status(401).json({ error: "Unauthorized update attempt." });
    }

    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
      return res.status(400).json({ error: "Title must be a non-empty string." });
    }

    try {
      const posts = await readPostsFromFile();
      const index = posts.findIndex(p => p.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Post not found" });
      }

      const existingPost = posts[index];
      let slug = existingPost.slug;

      // Regenerate slug if title is changed
      if (title && title.trim() !== existingPost.title) {
        const otherSlugs = posts.filter(p => p.id !== id).map(p => p.slug);
        slug = generateSlug(title, otherSlugs);
      }

      const updatedPost = {
        ...existingPost,
        title: title !== undefined ? title.trim() : existingPost.title,
        slug,
        summary: summary !== undefined ? summary.trim() : existingPost.summary,
        coverImageUrl: coverImageUrl !== undefined ? coverImageUrl.trim() : existingPost.coverImageUrl,
        content: content !== undefined ? content.trim() : existingPost.content,
        isPublished: isPublished !== undefined ? !!isPublished : existingPost.isPublished,
        updatedAt: Date.now()
      };

      posts[index] = updatedPost;
      await safeWriteFile(postsFilePath, posts);

      res.json(updatedPost);
    } catch (err: any) {
      console.error("[Blog Backend] Error updating post:", err);
      res.status(500).json({ error: "Failed to update blog post" });
    }
  });

  // Admin: Delete post
  app.delete("/api/posts/:id", authLimiter, async (req, res) => {
    const { username, password } = req.body;
    const { id } = req.params;

    if (!verifyAdmin(username, password)) {
      return res.status(401).json({ error: "Unauthorized update attempt." });
    }

    try {
      const posts = await readPostsFromFile();
      const index = posts.findIndex(p => p.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Post not found" });
      }

      posts.splice(index, 1);
      await safeWriteFile(postsFilePath, posts);

      res.json({ success: true, message: "Blog post deleted successfully" });
    } catch (err: any) {
      console.error("[Blog Backend] Error deleting post:", err);
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });

  // Public endpoint to read the globally active Discord & Music configuration
  app.get("/api/discord-config", (req, res) => {
    res.json({
      discordId: cachedDiscordConfig.discordId,
      discordClientId: cachedDiscordConfig.discordClientId,
      discordClientSecret: cachedDiscordConfig.discordClientSecret,
      lastfmUsername: cachedDiscordConfig.lastfmUsername,
    });
  });

  // Protected endpoint to update the globally active Discord & Music config
  app.post("/api/discord-config", authLimiter, async (req, res) => {
    const { username, password, discordId, discordClientId, discordClientSecret, lastfmUsername } = req.body;

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
        lastfmUsername: (lastfmUsername !== undefined ? lastfmUsername : "").trim(),
      };

      // Update the memory cache for instant access without blocking disk queries
      cachedDiscordConfig.discordId = updatedConfig.discordId;
      cachedDiscordConfig.discordClientId = updatedConfig.discordClientId;
      cachedDiscordConfig.discordClientSecret = updatedConfig.discordClientSecret;
      cachedDiscordConfig.lastfmUsername = updatedConfig.lastfmUsername;

      await safeWriteFile(configFilePath, updatedConfig);

      res.json({
        success: true,
        message: "Discord & Music configuration saved globally on server!",
      });

      // Instantly trigger polling check on save to update presence right away
      syncMusicTracks();
    } catch (err: any) {
      console.error("Error writing discord_config.json:", err);
      res
        .status(500)
        .json({ error: "Failed to persist configuration server-side." });
    }
  });

  // Dynamic multi-source music tracking system (Last.fm scrobbles + Lanyard Spotify)
  let isSyncing = false;
  let lastSyncTimestamp = 0;

  async function syncMusicTracks() {
    if (isSyncing) return;
    // Throttle syncs to no more than once every 4 seconds
    if (Date.now() - lastSyncTimestamp < 4000) return;

    isSyncing = true;
    lastSyncTimestamp = Date.now();

    try {
      let updated = false;

      // 1. Last.fm Integration (Preserves 24/7 scrobble history even when no visitors are on site)
      if (cachedDiscordConfig.lastfmUsername) {
        try {
          const lfmUser = cachedDiscordConfig.lastfmUsername;
          const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(lfmUser)}&api_key=b25752206e578c2e1f69201a073f13dd&format=json&limit=20`;
          const lfmRes = await fetch(url);
          if (lfmRes.ok) {
            const lfmData: any = await lfmRes.json();
            const tracks = lfmData?.recenttracks?.track;
            if (Array.isArray(tracks) && tracks.length > 0) {
              // Last.fm returns newest first. Reverse to process chronologically
              const reversed = [...tracks].reverse();

              for (const t of reversed) {
                const song = t.name;
                const artist = typeof t.artist === "object" ? t.artist["#text"] || t.artist.name : t.artist;
                const album = typeof t.album === "object" ? t.album["#text"] : t.album || "";

                if (!song || !artist) continue;

                let albumArtUrl = "";
                if (Array.isArray(t.image)) {
                  const imgObj = t.image.find((i: any) => i.size === "extralarge") || t.image.find((i: any) => i.size === "large") || t.image[2] || t.image[0];
                  if (imgObj && imgObj["#text"]) {
                    albumArtUrl = imgObj["#text"];
                  }
                }

                const trackId = t.mbid || `${song.toLowerCase()}-${artist.toLowerCase()}`;
                const playedAt = t.date?.uts ? parseInt(t.date.uts, 10) * 1000 : Date.now();

                // Check if song+artist is already recorded as most recent or in recentlyPlayed list
                const existingIdx = recentlyPlayed.findIndex(
                  (rp: any) => rp.song.toLowerCase() === song.toLowerCase() && rp.artist.toLowerCase() === artist.toLowerCase()
                );

                if (existingIdx === -1) {
                  const newTrack = {
                    trackId,
                    song,
                    artist,
                    album,
                    albumArtUrl,
                    playedAt,
                  };
                  recentlyPlayed.unshift(newTrack);
                  updated = true;

                  // Update Top Tracks play count
                  const topIdx = topTracks.findIndex(
                    (top: any) => top.song.toLowerCase() === song.toLowerCase() && top.artist.toLowerCase() === artist.toLowerCase()
                  );

                  if (topIdx !== -1) {
                    topTracks[topIdx].playCount = (topTracks[topIdx].playCount || 1) + 1;
                    topTracks[topIdx].playedAt = playedAt;
                    if (albumArtUrl) topTracks[topIdx].albumArtUrl = albumArtUrl;
                  } else {
                    topTracks.push({
                      trackId,
                      song,
                      artist,
                      album,
                      albumArtUrl,
                      playedAt,
                      playCount: 1,
                    });
                  }
                }
              }
            }
          }
        } catch (err: any) {
          console.warn("[Music Sync] Last.fm fetch warning:", err.message);
        }
      }

      // 2. Poll Lanyard for live Discord / Spotify presence
      if (cachedDiscordConfig.discordId) {
        try {
          const discordId = cachedDiscordConfig.discordId;
          const res = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
          if (res.ok) {
            const json: any = await res.json();
            if (json.success && json.data) {
              const d = json.data;
              if (d.listening_to_spotify && d.spotify) {
                const s = d.spotify;
                const trackId = s.track_id || `${s.song.toLowerCase()}-${s.artist.toLowerCase()}`;

                const mostRecent = recentlyPlayed[0];
                const isNew = !mostRecent ||
                  mostRecent.song.toLowerCase() !== s.song.toLowerCase() ||
                  mostRecent.artist.toLowerCase() !== s.artist.toLowerCase();

                if (isNew) {
                  const newTrack = {
                    trackId,
                    song: s.song,
                    artist: s.artist,
                    album: s.album,
                    albumArtUrl: s.album_art_url,
                    playedAt: Date.now(),
                  };

                  recentlyPlayed.unshift(newTrack);
                  updated = true;

                  const topIdx = topTracks.findIndex(
                    (top: any) => top.song.toLowerCase() === s.song.toLowerCase() && top.artist.toLowerCase() === s.artist.toLowerCase()
                  );

                  if (topIdx !== -1) {
                    topTracks[topIdx].playCount = (topTracks[topIdx].playCount || 1) + 1;
                    topTracks[topIdx].playedAt = Date.now();
                    if (s.album_art_url) topTracks[topIdx].albumArtUrl = s.album_art_url;
                  } else {
                    topTracks.push({
                      trackId,
                      song: s.song,
                      artist: s.artist,
                      album: s.album,
                      albumArtUrl: s.album_art_url,
                      playedAt: Date.now(),
                      playCount: 1,
                    });
                  }
                }
              }
            }
          }
        } catch (err: any) {
          console.warn("[Music Sync] Lanyard fetch warning:", err.message);
        }
      }

      // 3. Save state to disk if new tracks were logged
      if (updated) {
        recentlyPlayed = recentlyPlayed.slice(0, 20);

        topTracks.sort((a: any, b: any) => {
          if (b.playCount !== a.playCount) {
            return b.playCount - a.playCount;
          }
          return b.playedAt - a.playedAt;
        });
        topTracks = topTracks.slice(0, 50);

        await safeWriteFile(recentlyPlayedFilePath, recentlyPlayed);
        await safeWriteFile(topTracksFilePath, topTracks);
        console.log("[Music Sync] Successfully updated recently played & top tracks.");
      }
    } catch (err: any) {
      console.error("[Music Sync] Error during track sync:", err.message);
    } finally {
      isSyncing = false;
    }
  }

  // Periodic polling check (runs every 10 seconds background)
  setInterval(syncMusicTracks, 10000);
  // Initial polling check on startup
  setTimeout(syncMusicTracks, 2000);

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

  // Graceful range unsatisfiable and static file handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.name === "RangeNotSatisfiableError" || err.status === 416 || err.code === "ERR_HTTP_INVALID_STATUS_CODE") {
      writeDebugLog(`[Range Intercept] Range unsatisfiable or status error intercepted for ${req.originalUrl || req.url}: ${err.message}`);
      if (!res.headersSent) {
        res.status(416).send("Requested Range Not Satisfiable");
      }
      return;
    }
    next(err);
  });

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
