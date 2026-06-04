import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Music,
  Gamepad2,
  Clock,
  ExternalLink,
  Terminal,
  Radio,
  Code2,
  Sparkles,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Volume2,
  Shield,
  BadgeAlert,
  Compass,
  Cpu,
  Tv,
  HelpCircle,
  Gem,
} from "lucide-react";

// --- Types ---
interface DiscordPresenceWidgetProps {
  discordStatus: {
    status: "online" | "idle" | "dnd" | "offline";
    customStatus?: string;
    game?: string;
    avatar?: string;
    tag?: string;
    raw?: any;
  } | null;
}

// --- Discord Badge Resolver Helper ---
interface DiscordBadge {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
}

export default function DiscordPresenceWidget({
  discordStatus,
}: DiscordPresenceWidgetProps) {
  const [now, setNow] = useState(Date.now());
  const [spotifyArtError, setSpotifyArtError] = useState(false);
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const rawData = discordStatus?.raw;
  const spotify = rawData?.spotify;
  const currentArtUrl = spotify?.album_art_url;

  // Reset spotify art error state when album art URL changes so next song cover can load
  useEffect(() => {
    setSpotifyArtError(false);
  }, [currentArtUrl]);

  // Local clock sync running once a second for smooth live active progress bars or uptime stats
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!discordStatus) {
    return (
      <div className="w-full p-6 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-center text-stone-500 text-xs font-mono tracking-wider shadow-inner">
        <Terminal className="w-4 h-4 mr-2.5 animate-spin text-cyan-400" />
        STATUS SENSOR: Not Available / May be Offline
      </div>
    );
  }

  const isOnline = discordStatus.status !== "offline";

  // Decode Discord Badges based on public_flags
  const publicFlags = rawData?.discord_user?.public_flags || 0;
  
  const getBadges = (flags: number): DiscordBadge[] => {
    const badgesList: DiscordBadge[] = [];

    // Discord Staff
    if ((flags & (1 << 0)) !== 0) {
      badgesList.push({
        id: "staff",
        name: "Discord Staff",
        color: "from-blue-500 to-indigo-600 shadow-blue-500/20",
        icon: <Shield className="w-3.5 h-3.5 text-white" />,
      });
    }
    // Partnered Server Owner
    if ((flags & (1 << 1)) !== 0) {
      badgesList.push({
        id: "partner",
        name: "Partnered Server Owner",
        color: "from-cyan-500 to-blue-500 shadow-cyan-500/20",
        icon: <BadgeAlert className="w-3.5 h-3.5 text-white" />,
      });
    }
    // HypeSquad Events
    if ((flags & (1 << 2)) !== 0) {
      badgesList.push({
        id: "hypesquad_events",
        name: "HypeSquad Events Attendee",
        color: "from-pink-500 to-rose-600 shadow-pink-500/20",
        icon: <Sparkles className="w-3.5 h-3.5 text-white" />,
      });
    }
    // Bug Hunter Green
    if ((flags & (1 << 3)) !== 0) {
      badgesList.push({
        id: "bug_hunter_green",
        name: "Bug Hunter (Tier 1)",
        color: "from-emerald-400 to-teal-500 shadow-emerald-500/20",
        icon: <Terminal className="w-3.5 h-3.5 text-white" />,
      });
    }
    // HypeSquad Bravery
    if ((flags & (1 << 6)) !== 0) {
      badgesList.push({
        id: "bravery",
        name: "HypeSquad Bravery",
        color: "from-purple-500 to-indigo-500 shadow-purple-500/20",
        icon: (
          <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 18l-7-3.8V8.2L12 5v15z" />
          </svg>
        ),
      });
    }
    // HypeSquad Brilliance
    if ((flags & (1 << 7)) !== 0) {
      badgesList.push({
        id: "brilliance",
        name: "HypeSquad Brilliance",
        color: "from-orange-400 to-red-500 shadow-orange-500/20",
        icon: (
          <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12 2l9 9-9 9-9-9 9-9zm0 4.2L7.2 12 12 16.8 16.8 12 12 6.2z" />
          </svg>
        ),
      });
    }
    // HypeSquad Balance
    if ((flags & (1 << 8)) !== 0) {
      badgesList.push({
        id: "balance",
        name: "HypeSquad Balance",
        color: "from-teal-400 to-cyan-500 shadow-cyan-500/20",
        icon: (
          <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12 2L4 9l8 13 8-13-8-7zm0 4l5.3 4.7L12 19.3l-5.3-8.6L12 6z" />
          </svg>
        ),
      });
    }
    // Early Supporter
    if ((flags & (1 << 9)) !== 0) {
      badgesList.push({
        id: "early_supporter",
        name: "Early Supporter",
        color: "from-rose-400 to-pink-500 shadow-rose-500/20",
        icon: <Compass className="w-3.5 h-3.5 text-white" />,
      });
    }
    // Bug Hunter Gold (Tier 2)
    if ((flags & (1 << 14)) !== 0) {
      badgesList.push({
        id: "bug_hunter_gold",
        name: "Bug Hunter (Tier 2)",
        color: "from-amber-400 to-yellow-600 shadow-yellow-500/20",
        icon: <Terminal className="w-3.5 h-3.5 text-white" />,
      });
    }
    // Early Verified Bot Developer
    if ((flags & (1 << 17)) !== 0) {
      badgesList.push({
        id: "bot_developer",
        name: "Early Verified Bot Developer",
        color: "from-blue-600 to-cyan-600 shadow-blue-600/20",
        icon: <Cpu className="w-3.5 h-3.5 text-white" />,
      });
    }
    // Moderator Programs Alumni
    if ((flags & (1 << 18)) !== 0) {
      badgesList.push({
        id: "mod_alumni",
        name: "Moderator Programs Alumni",
        color: "from-blue-700 to-indigo-800 shadow-blue-800/20",
        icon: <Tv className="w-3.5 h-3.5 text-white" />,
      });
    }
    // Active Developer
    if ((flags & (1 << 22)) !== 0) {
      badgesList.push({
        id: "active_developer",
        name: "Active Developer",
        color: "from-sky-400 to-blue-500 shadow-sky-400/25",
        icon: (
          <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12 2l8 4.2v9.6L12 22l-8-6.2V6.2L12 2zm0 3l-5 2.6v6.8l5 2.6 5-2.6V7.6L12 5zm0 3.2c1.3 0 2.4 1.1 2.4 2.4s-1.1 2.4-2.4 2.4-2.4-1.1-2.4-2.4 1.1-2.4 2.4-2.4z" />
          </svg>
        ),
      });
    }

    // Always append secondary Nitro decoration badge if they have premium decoration styling or custom avatar decoration
    if (rawData?.discord_user?.avatar_decoration_data || isOnline) {
      badgesList.push({
        id: "nitro",
        name: "Discord Premium Nitro",
        color: "from-indigo-500 via-purple-500 to-pink-500 shadow-purple-500/20 animate-pulse",
        icon: <Gem className="w-3.5 h-3.5 text-white" />,
      });
    }

    return badgesList;
  };

  const activeBadges = getBadges(publicFlags);

  // Status colors & labels mapping
  const statusConfig = {
    online: { color: "bg-[#23a55a]", glow: "shadow-[#23a55a]/50", label: "Online" },
    idle: { color: "bg-[#f0b232]", glow: "shadow-[#f0b232]/50", label: "Idle" },
    dnd: { color: "bg-[#f23f43]", glow: "shadow-[#f23f43]/50", label: "Do Not Disturb" },
    offline: { color: "bg-[#80848e]", glow: "shadow-[#80848e]/30", label: "Not Available / May be Offline" },
  };

  const statusInfo = statusConfig[discordStatus.status] || statusConfig.offline;

  // 1. Spotify Information Extraction
  const isListeningSpotify = rawData?.listening_to_spotify === true && spotify;

  let spotifyProgressPercent = 0;
  let spotifyProgressStr = "";
  if (isListeningSpotify && spotify?.timestamps) {
    const { start, end } = spotify.timestamps;
    const duration = end - start;
    const current = Math.max(0, Math.min(duration, now - start));
    spotifyProgressPercent = duration > 0 ? (current / duration) * 100 : 0;

    const formatTime = (ms: number) => {
      const secsTotal = Math.floor(ms / 1000);
      const mins = Math.floor(secsTotal / 60);
      const secs = secsTotal % 60;
      return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };
    spotifyProgressStr = `${formatTime(current)} / ${formatTime(duration)}`;
  }

  // 2. Playable / Code Activity Extraction
  const activityList = rawData?.activities || [];
  const activeApp = activityList.find(
    (act: any) => act.type === 0 && act.id !== "spotify",
  );

  let appElapsedStr = "";
  if (activeApp && activeApp.timestamps?.start) {
    const elapsedMs = now - activeApp.timestamps.start;
    const secsTotal = Math.floor(elapsedMs / 1000);
    const hrs = Math.floor(secsTotal / 3600);
    const mins = Math.floor((secsTotal % 3600) / 60);
    const secs = secsTotal % 60;
    appElapsedStr =
      hrs > 0
        ? `${hrs}h ${mins}m elapsed`
        : `${mins}:${secs < 10 ? "0" : ""}${secs} elapsed`;
  }

  // Discord asset resolution
  const getAppAssetUrl = (app: any) => {
    if (!app || !app.assets || !app.assets.large_image) return null;
    const { application_id, assets } = app;
    const largeImage = assets.large_image;

    if (largeImage.startsWith("mp:external/")) {
      const match = largeImage.match(/https\/(.*)/);
      if (match) return `https://${match[1]}`;
    }
    return `https://cdn.discordapp.com/app-assets/${application_id}/${largeImage}.png`;
  };

  const getSmallAppAssetUrl = (app: any) => {
    if (!app || !app.assets || !app.assets.small_image) return null;
    const { application_id, assets } = app;
    const smallImage = assets.small_image;

    if (smallImage.startsWith("mp:external/")) {
      const match = smallImage.match(/https\/(.*)/);
      if (match) return `https://${match[1]}`;
    }
    return `https://cdn.discordapp.com/app-assets/${application_id}/${smallImage}.png`;
  };

  const appAssetUrl = activeApp ? getAppAssetUrl(activeApp) : null;
  const appSmallAssetUrl = activeApp ? getSmallAppAssetUrl(activeApp) : null;

  // Animated sound visualizer matching Guns.lol styles
  const visualizerBars = Array.from({ length: 12 }).map((_, i) => {
    const delay = [0.8, 1.2, 0.4, 0.7, 1.5, 0.6, 1.0, 1.3, 0.5, 0.9, 1.4, 0.3][i % 12];
    const duration = [0.6, 0.8, 1.1, 0.7, 1.3, 0.9, 1.2, 0.8, 1.0, 0.7, 1.4, 0.9][i % 12];
    return (
      <span
        key={i}
        className="w-[2px] bg-gradient-to-t from-emerald-500 via-cyan-400 to-teal-400 rounded-full"
        style={{
          height: isListeningSpotify ? "100%" : "15%",
          animation: isListeningSpotify
            ? `vertical-bounce ${duration}s ease-in-out infinite`
            : "none",
          animationDelay: `${delay}s`,
          transformOrigin: "bottom",
        }}
      />
    );
  });

  return (
    <div className="w-full mt-4 p-5 sm:p-6 rounded-2xl relative border border-white/5 bg-black/45 backdrop-blur-md overflow-hidden transition-all duration-500 hover:border-cyan-500/20 shadow-[0_15px_45px_rgba(0,0,0,0.4)]">
      {/* Decorative cybernetic backdrop overlay grids */}
      <div className="absolute inset-x-0 -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      <div className="absolute top-2.5 right-4 pointer-events-none select-none z-10 flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
        <span className="text-[8px] font-mono text-cyan-400/80 uppercase tracking-widest font-black">
          Presence Status Active
        </span>
      </div>

      {/* Profile summary header inspired directly by Guns.lol Discord Layout */}
      <div className="flex flex-col sm:flex-row items-center gap-4.5 border-b border-white/5 pb-4 mb-4">
        {/* Big Avatar Frame with Status Indicator Ring and glowing drop shadows */}
        <div className="relative group shrink-0">
          <div className="absolute -inset-1.5 bg-gradient-to-tr from-cyan-500/20 via-indigo-500/0 to-emerald-500/20 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-1000" />
          <div className="relative w-18 h-18 rounded-2xl overflow-hidden border border-white/15 bg-stone-900 shadow-md transform group-hover:scale-105 transition-transform duration-300">
            {discordStatus.avatar ? (
              <img
                src={discordStatus.avatar}
                alt={discordStatus.tag || "Discord profile link"}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-stone-900 to-stone-850 text-white/45">
                <Terminal className="w-7 h-7 animate-pulse" />
              </div>
            )}
          </div>

          {/* Active Status Ring (pulsing bottom-right) */}
          <span className="absolute bottom-[-4px] right-[-4px] flex h-5 w-5 pointer-events-auto cursor-default">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusInfo.color} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-5 w-5 border-2 border-[#09090e] items-center justify-center ${statusInfo.color} ${statusInfo.glow} shadow-md`}>
              <span className="w-1 w-1 bg-white/30 rounded-full" />
            </span>
          </span>
        </div>

        {/* Discord user account identification meta & custom badges inline tray */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2.5 justify-center sm:justify-start">
            <span className="text-base sm:text-lg font-black text-stone-100 tracking-tight hover:text-cyan-400 transition-colors cursor-default">
              {rawData?.discord_user?.global_name || discordStatus.tag || "loading"}
            </span>
            <span className="text-xs sm:text-sm text-stone-400 font-mono tracking-tight self-center">
              @{discordStatus.tag || "duziy"}
            </span>
          </div>

          {/* Guns.lol style profile status tag lines */}
          <p className="text-xs text-stone-300 font-sans tracking-wide mt-1 h-3.5 flex items-center justify-center sm:justify-start gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-500 inline-block shrink-0" />
            Status: <span className="font-semibold text-stone-200 capitalize">{statusInfo.label}</span>
          </p>

          {/* Dynamic Badge Showcase Tray with clean custom modern CSS Tooltips on hover */}
          {activeBadges.length > 0 && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-3">
              {activeBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="relative group flex items-center"
                  onMouseEnter={() => setIsHovered(badge.id)}
                  onMouseLeave={() => setIsHovered(null)}
                >
                  <div className={`p-1.5 rounded-md bg-gradient-to-tr ${badge.color} border border-white/5 cursor-help hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm flex items-center justify-center w-7 h-7`}>
                    {badge.icon}
                  </div>
                  
                  {/* Glass Tooltip */}
                  <AnimatePresence>
                    {isHovered === badge.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: -26, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-stone-900 border border-white/10 text-white font-semibold text-[9px] tracking-wider whitespace-nowrap uppercase shadow-xl z-30 pointer-events-none font-mono"
                      >
                        {badge.name}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-stone-900" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Speech-bubble quote format custom status if present on user profile */}
      {discordStatus.customStatus && (
        <div className="mb-4 text-xs sm:text-sm leading-relaxed text-stone-200 bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 relative group hover:bg-white/[0.04] transition-all duration-305">
          <span className="absolute top-2.5 left-3 text-cyan-400 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
            <Sparkles className="w-4.5 h-4.5" />
          </span>
          <div className="flex items-center gap-1.5 pl-5 flex-1 min-w-0">
            <span className="italic select-all break-words">"{discordStatus.customStatus}"</span>
          </div>
        </div>
      )}

      {/* Presence details body module container */}
      <AnimatePresence mode="wait">
        {/* VIEW A: SPOTIFY HIGH FIDELITY STREAMING BOX */}
        {isListeningSpotify ? (
          <motion.div
            key="spotify-visualizer"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col text-left space-y-4 p-4.5 rounded-xl border border-emerald-500/10 bg-gradient-to-br from-black/60 to-emerald-950/15"
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 tracking-wider uppercase">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                Listening to Spotify
              </span>

              {/* Glowing animated visualizer graph bars */}
              <div className="flex items-end gap-[1.5px] h-3.5 px-1">
                {visualizerBars}
              </div>
            </div>

            {/* Spotify Track Meta Details layout with vinyl rotation asset */}
            <div className="flex items-center gap-4.5">
              {/* Spinning overlay record vinyl setup */}
              <div className="relative w-16 h-16 flex-shrink-0 group">
                <div className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-white/5">
                  <Music className="w-5 h-5 text-emerald-400 animate-spin" />
                </div>

                {spotify.album_art_url && !spotifyArtError ? (
                  <img
                    src={spotify.album_art_url}
                    alt={spotify.album || "Album cover"}
                    onError={() => setSpotifyArtError(true)}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full border border-white/10 shadow-lg object-cover shadow-emerald-500/10 animate-[spin_12s_linear_infinite]"
                    style={{ animationPlayState: "running" }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border border-white/10 bg-emerald-500/10 flex items-center justify-center text-emerald-400 animate-spin">
                    <Music className="w-6 h-6" />
                  </div>
                )}
                {/* Vinyl physical center circle spindle hole */}
                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#0a0a0f] border border-white/20 z-20" />
              </div>

              {/* Title & Artist & Album identification links */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm sm:text-base font-extrabold text-stone-100 truncate block hover:text-emerald-400 transition-colors">
                    {spotify.song}
                  </span>
                  {spotify.track_id && (
                    <a
                      href={`https://open.spotify.com/track/${spotify.track_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-400 hover:text-emerald-400 transition-colors shrink-0 p-0.5 hover:bg-white/5 rounded"
                      title="Listen along on Spotify"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <span className="text-xs sm:text-sm text-stone-300 truncate block font-sans mt-0.5">
                  by{" "}
                  <span className="font-semibold text-stone-100">
                    {spotify.artist
                      ? spotify.artist.replace(/;/g, ", ")
                      : "Unknown Artist"}
                  </span>
                </span>
                <span className="text-[11px] text-stone-400 truncate block font-mono mt-0.5 uppercase tracking-wide">
                  on {spotify.album || "Single Release"}
                </span>
              </div>
            </div>

            {/* Realistic Mock/Decorative interactive Music Navigation Deck to mirror Guns.lol premium vibes */}
            <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 rounded-lg px-3 py-2 text-stone-400">
              <div className="flex items-center gap-4">
                <button className="hover:text-emerald-400 transition-colors" title="Shuffle Mode">
                  <Shuffle className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                </button>
                <button className="hover:text-amber-500 transition-colors" title="Previous Track">
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:scale-105 transition-all duration-200" title="Song Status: Streaming">
                  <Pause className="w-3 h-3 fill-current" />
                </button>
                <button className="hover:text-amber-500 transition-colors" title="Fast Forward">
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
                <button className="hover:text-emerald-400 transition-colors" title="Repeat Single">
                  <Repeat className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono opacity-90 text-emerald-400/90">
                <Volume2 className="w-4 h-4 text-stone-400" />
                <span className="tracking-widest">320KBPS</span>
              </div>
            </div>

            {/* Dynamic Music Progress Bar slider scale tracker */}
            <div className="space-y-1.5 bg-black/20 p-3 rounded-lg border border-white/5">
              <div className="w-full bg-white/5 rounded-full h-[5px] relative group overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-linear relative"
                  style={{ width: `${spotifyProgressPercent}%` }}
                >
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow shadow-black" />
                </div>
              </div>
              <div className="flex justify-between text-xs font-mono text-stone-400">
                <span className="text-emerald-400 font-bold">
                  {spotifyProgressStr
                    ? spotifyProgressStr.split(" / ")[0]
                    : "0:00"}
                </span>
                <span>
                  {spotifyProgressStr
                    ? spotifyProgressStr.split(" / ")[1]
                    : "0:00"}
                </span>
              </div>
            </div>
          </motion.div>
        ) : activeApp ? (
          /* VIEW B: HIGH RESOLUTION GAMING / CODING ACTIVITY CARD */
          <motion.div
            key="gaming-rich-presence"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col text-left space-y-4 p-4.5 rounded-xl border border-cyan-500/10 bg-gradient-to-br from-black/60 to-cyan-950/15"
          >
            {/* Header activity line */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 tracking-wider uppercase">
                {activeApp.name?.toLowerCase().includes("code") ? (
                  <Code2 className="w-3.5 h-3.5" />
                ) : (
                  <Gamepad2 className="w-3.5 h-3.5" />
                )}
                Playing Game / Editing App
              </span>
              {appElapsedStr && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-stone-300 font-bold bg-white/5 border border-white/5 px-2.5 py-1 rounded">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  {appElapsedStr}
                </span>
              )}
            </div>

            {/* Rich Presence detailed item frame */}
            <div className="flex items-center gap-4.5">
              {/* Double asset stacking design similar to authentic Discord client */}
              <div className="relative w-16 h-16 flex-shrink-0">
                {appAssetUrl ? (
                  <div className="relative w-16 h-16">
                    <img
                      src={appAssetUrl}
                      alt={activeApp.name || "App logo"}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                      className="w-16 h-16 rounded-lg border border-white/10 shadow-lg object-cover"
                    />
                    {/* Small overlay badge if present in the bottom right corner */}
                    {appSmallAssetUrl && (
                      <img
                        src={appSmallAssetUrl}
                        alt="Small badge"
                        className="absolute bottom-[-4px] right-[-4px] w-7 h-7 rounded-full border border-[#09090e] bg-[#09090e] object-cover shadow-md z-10"
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border border-white/10 bg-cyan-500/10 flex items-center justify-center text-cyan-400 shadow-inner">
                    {activeApp.name?.toLowerCase().includes("code") ? (
                      <Code2 className="w-7 h-7" />
                    ) : (
                      <Gamepad2 className="w-7 h-7 animate-pulse" />
                    )}
                  </div>
                )}
              </div>

              {/* Text Description Fields with custom font-sizes */}
              <div className="flex-1 min-w-0">
                <span className="text-sm sm:text-base font-extrabold text-stone-100 block truncate">
                  {activeApp.name}
                </span>
                {activeApp.details && (
                  <span className="text-xs sm:text-sm text-stone-300 block truncate font-sans mt-0.5">
                    {activeApp.details}
                  </span>
                )}
                {activeApp.state && (
                  <span className="text-[11px] font-semibold text-stone-400 block truncate font-mono mt-0.5">
                    {activeApp.state}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* VIEW C: SYSTEM IDLE / OFFLINE CHILLING VIEW */
          <motion.div
            key="terminal-idle"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col text-left space-y-3.5"
          >
            {/* Minimal system banner container */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-stone-300 tracking-wider uppercase">
                <Terminal className="w-3.5 h-3.5 text-stone-400" />
                Discord Stream Status
              </span>

              <span
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded font-mono text-xs font-black tracking-widest ${
                  isOnline
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                    : "bg-stone-500/5 text-stone-500 border border-white/5"
                }`}
              >
                ● {discordStatus.status.toUpperCase()}
              </span>
            </div>

            {/* Ambient terminal panel display when user is completely idle */}
            <div className="flex flex-col items-center justify-center py-8 px-6 text-center border border-white/5 bg-white/[0.005] rounded-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/[0.015] pointer-events-none" />
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-stone-400 mb-3 group-hover:scale-110 active:scale-95 transition-transform duration-300">
                <Music className="w-6 h-6 opacity-30 group-hover:opacity-50 transition-opacity" />
              </div>
              <span className="text-sm font-bold text-stone-200">
                Currently Quieter Than Space
              </span>
              <span className="text-xs text-stone-400 mt-2.5 max-w-[340px] leading-relaxed font-sans">
                Spotify flow is inactive and no active rich presence logs are broadcasted from Discord right now.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
