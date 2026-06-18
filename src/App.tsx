import { useState, useEffect, useRef, SVGProps } from "react";
import { motion, AnimatePresence } from "motion/react";
import DiscordPresenceWidget from "./components/DiscordPresenceWidget";
import RecentlyPlayedWidget from "./components/RecentlyPlayedWidget";
import { getFingerprint } from "./utils/visitor";
import {
  Tv,
  AudioLines,
  Gamepad,
  MessageSquare,
  Box,
  Send,
  User,
  ChevronLeft,
  Music,
  Video,
  Clapperboard,
  Gamepad2,
  Volume2,
  VolumeX,
  Terminal,
  CheckSquare,
  Code,
  Laptop,
  Mail,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Play,
  Pause,
  Eye,
  ListMusic,
} from "lucide-react";

// Track if current tab/load has already successfully recorded a visitor hit
let isHitLoggedThisLoad = false;

// Custom SVG components for brand icons removed in newer versions of lucide-react
const Youtube = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25a29 29 0 0 0-.46-5.33z" />
    <polygon
      points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"
      fill="currentColor"
    />
  </svg>
);

const Twitch = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9H9V6h2v5zm4 0h-2V6h2v5z" />
  </svg>
);

const Instagram = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Twitter = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Github = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

// Social Platforms Data
interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: any; // Lucide component reference
  color: string;
  category: "media" | "streaming" | "gaming" | "social" | "other";
  iconSlug?: string;
}

// Inline brand icon renderer utilizing Simple Icons SVGs for responsive size & color
function SvgBrandIcon({
  slug,
  fallback: Fallback,
  className,
}: {
  slug: string;
  fallback: any;
  className?: string;
}) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`https://cdn.jsdelivr.net/npm/simple-icons@11/icons/${slug}.svg`)
      .then((res) => {
        if (res.ok) return res.text();
        throw new Error("Failed to load vector icon");
      })
      .then((text) => {
        if (!active) return;
        // Clean title and inject fill/fit properties so it colors and scales elegantly
        const cleaned = text
          .replace(/<title>.*?<\/title>/, "")
          .replace(/<svg /, '<svg class="w-full h-full" fill="currentColor" ');
        setSvgContent(cleaned);
      })
      .catch((err) => {
        if (!active) return;
        console.warn(
          `Could not load brand SVG for ${slug}, utilizing fallback icon.`,
          err,
        );
        setHasError(true);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (hasError || !svgContent) {
    return <Fallback className={className} />;
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

// Brand hover-driven ambient backgrounds for main card
const glowColors: Record<string, string> = {
  YouTube: "shadow-[0_20px_50px_rgba(255,0,0,0.18)] border-red-500/25",
  Kick: "shadow-[0_20px_50px_rgba(83,252,24,0.18)] border-emerald-400/25",
  Twitch: "shadow-[0_20px_50px_rgba(145,70,255,0.18)] border-indigo-400/25",
  TikTok: "shadow-[0_20px_50px_rgba(1,242,255,0.18)] border-cyan-400/25",
  Instagram: "shadow-[0_20px_50px_rgba(225,48,108,0.18)] border-pink-500/25",
  "Twitter / X":
    "shadow-[0_20px_50px_rgba(255,255,255,0.12)] border-stone-400/25",
  GitHub: "shadow-[0_20px_50px_rgba(255,255,255,0.12)] border-stone-400/25",
  SoundCloud: "shadow-[0_20px_50px_rgba(255,85,0,0.18)] border-orange-500/25",
  Roblox: "shadow-[0_20px_50px_rgba(255,0,0,0.18)] border-red-500/25",
  Reddit: "shadow-[0_20px_50px_rgba(255,69,0,0.18)] border-orange-600/25",
  "NameMC (Skins)":
    "shadow-[0_20px_50px_rgba(83,252,24,0.18)] border-emerald-400/25",
  Steam: "shadow-[0_20px_50px_rgba(0,173,238,0.18)] border-sky-400/25",
  Telegram: "shadow-[0_20px_50px_rgba(36,161,222,0.18)] border-sky-500/25",
};

// Brand hover-driven ambient backdrop glows for avatar orbit
const avatarGlowColors: Record<string, string> = {
  YouTube: "bg-red-500/20",
  Kick: "bg-emerald-400/20",
  Twitch: "bg-indigo-400/20",
  TikTok: "bg-cyan-400/20",
  Instagram: "bg-pink-500/20",
  "Twitter / X": "bg-stone-300/15",
  GitHub: "bg-stone-300/15",
  SoundCloud: "bg-orange-500/20",
  Roblox: "bg-red-500/20",
  Reddit: "bg-orange-600/20",
  "NameMC (Skins)": "bg-emerald-400/20",
  Steam: "bg-sky-400/20",
  Telegram: "bg-sky-500/20",
};

export default function App() {
  // Navigation & Interactive States
  const [hasStarted, setHasStarted] = useState(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      return path === "/adminportaldev";
    }
    return false;
  });
  const [isPlaying, setIsPlaying] = useState(false);

  const [activeTab, setActiveTabState] = useState<"home" | "about" | "admin">(
    () => {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path === "/adminportaldev") return "admin";
        return path === "/about" ? "about" : "home";
      }
      return "home";
    },
  );

  const setActiveTab = (tab: "home" | "about" | "admin") => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      let newPath = "/";
      if (tab === "about") newPath = "/about";
      else if (tab === "admin") newPath = "/adminportaldev";

      if (window.location.pathname !== newPath) {
        window.history.pushState(null, "", newPath);
      }
    }
  };

  useEffect(() => {
    if (activeTab === "admin") {
      document.title = "duziy | Admin Portal";
    } else {
      document.title = "duziy | Profile";
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/adminportaldev") {
        setActiveTabState("admin");
      } else {
        setActiveTabState(path === "/about" ? "about" : "home");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Secure Admin Credentials Local state
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const [isSpinning, setIsSpinning] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("isMuted");
      return saved ? saved === "true" : false;
    }
    return false;
  });
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("volume");
      return saved !== null ? parseFloat(saved) : 0.3;
    }
    return 0.3;
  });
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [prevVolume, setPrevVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("prevVolume");
      return saved !== null ? parseFloat(saved) : 0.3;
    }
    return 0.3;
  });

  // Save volume control states to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("volume", volume.toString());
      localStorage.setItem("isMuted", isMuted.toString());
      localStorage.setItem("prevVolume", prevVolume.toString());
    }
  }, [volume, isMuted, prevVolume]);

  const [avatarError, setAvatarError] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);
  const [iconErrors, setIconErrors] = useState<Record<string, boolean>>({});

  // Connected Discord Live Status State
  const [discordId, setDiscordId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("discord_id") || "1025531959736860714";
    }
    return "1025531959736860714";
  });
  const [discordClientId, setDiscordClientId] = useState("");
  const [discordClientSecret, setDiscordClientSecret] = useState("");
  const [tempDiscordClientId, setTempDiscordClientId] = useState("");
  const [tempDiscordClientSecret, setTempDiscordClientSecret] = useState("");

  const [discordStatus, setDiscordStatus] = useState<{
    status: "online" | "idle" | "dnd" | "offline";
    customStatus?: string;
    game?: string;
    avatar?: string;
    tag?: string;
    raw?: any;
  } | null>(null);
  const [isEditingDiscordId, setIsEditingDiscordId] = useState(false);
  const [tempDiscordId, setTempDiscordId] = useState(discordId);
  const [discordAvatarError, setDiscordAvatarError] = useState(false);

  // Reset avatar error when a new Discord ID is loaded
  useEffect(() => {
    setDiscordAvatarError(false);
  }, [discordId]);

  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [recentlyPlayedSongs, setRecentlyPlayedSongs] = useState<any[]>([]);
  const [topPlayedSongs, setTopPlayedSongs] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState("");

  // Load configuration, visitor stats and recently played history on mount
  useEffect(() => {
    // 1. Fetch server-persisted Discord system configuration
    fetch("/api/discord-config")
      .then((res) => {
        if (!res.ok) throw new Error("Config request invalid");
        return res.json();
      })
      .then((data) => {
        const localSavedId =
          typeof window !== "undefined"
            ? localStorage.getItem("discord_id")
            : null;
        if (data.discordId) {
          if (data.discordId !== "1025531959736860714" || !localSavedId) {
            setDiscordId(data.discordId);
            setTempDiscordId(data.discordId);
          } else if (localSavedId) {
            setDiscordId(localSavedId);
            setTempDiscordId(localSavedId);
          }
        }
        if (data.discordClientId) {
          setDiscordClientId(data.discordClientId);
          setTempDiscordClientId(data.discordClientId);
        }
        if (data.discordClientSecret) {
          setDiscordClientSecret(data.discordClientSecret);
          setTempDiscordClientSecret(data.discordClientSecret);
        }
      })
      .catch((err) => {
        console.warn("Could not retrieve server-side Discord config:", err);
      });

    // 2. Track page visitor (unique hit counter) with double-firing session guards
    const localFallbackCount = localStorage.getItem("portfolio_total_views");

    if (localFallbackCount) {
      setVisitorCount(parseInt(localFallbackCount, 10));
    }

    const hasSessionHitLogged =
      typeof window !== "undefined" &&
      sessionStorage.getItem("portfolio_hit_registered") === "true";

    if (isHitLoggedThisLoad || hasSessionHitLogged) {
      // Already tracked in this lifecycle or active browser session, just grab the stable count from server RAM
      fetch(`/api/visitor/count?t=${Date.now()}`, {
        cache: "no-store",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.count === "number") {
            setVisitorCount(data.count);
            localStorage.setItem(
              "portfolio_total_views",
              data.count.toString(),
            );
          }
        })
        .catch(() => {});
    } else {
      // Set lock immediately to block concurrent StrictMode mounting hooks
      isHitLoggedThisLoad = true;
      const fingerprint = getFingerprint();

      fetch(`/api/visitor/hit?t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fp: fingerprint }),
        cache: "no-store",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.count === "number") {
            setVisitorCount(data.count);
            localStorage.setItem(
              "portfolio_total_views",
              data.count.toString(),
            );
            if (typeof window !== "undefined") {
              sessionStorage.setItem("portfolio_hit_registered", "true");
            }
          }
        })
        .catch((err) => {
          console.warn(
            "Could not log hit, retrieving stable counter count:",
            err,
          );
          fetch(`/api/visitor/count?t=${Date.now()}`, {
            cache: "no-store",
          })
            .then((res) => res.json())
            .then((data) => {
              if (data && typeof data.count === "number") {
                setVisitorCount(data.count);
                localStorage.setItem(
                  "portfolio_total_views",
                  data.count.toString(),
                );
              }
            })
            .catch(() => {});
        });
    }

    // 3. Polling for Recently Played and Top Spotify songs lists
    const fetchRecentlyPlayed = () => {
      fetch("/api/recently-played")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setRecentlyPlayedSongs(data);
          }
        })
        .catch(() => {});
    };

    const fetchTopPlayed = () => {
      fetch("/api/top-tracks")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setTopPlayedSongs(data);
          }
        })
        .catch(() => {});
    };

    fetchRecentlyPlayed();
    fetchTopPlayed();
    const rpInterval = setInterval(() => {
      fetchRecentlyPlayed();
      fetchTopPlayed();
    }, 15000);

    return () => clearInterval(rpInterval);
  }, []);

  const saveDiscordConfigToServer = async (targetId: string, targetClientId: string = "", targetClientSecret: string = "") => {
    setSaveStatus("Saving...");
    try {
      const res = await fetch("/api/discord-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUsername,
          password: adminPassword,
          discordId: targetId,
          discordClientId: targetClientId,
          discordClientSecret: targetClientSecret,
        }),
      });
      if (!res.ok) {
        const errObj = await res.json().catch(() => ({}));
        throw new Error(errObj.error || "Failed to persist config on server.");
      }
      setSaveStatus("Saved globally & locally!");
      setTimeout(() => setSaveStatus(""), 4000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus("Saved locally in browser!");
      setTimeout(() => setSaveStatus(""), 4000);
    }
  };

  // Typewriter bio states
  const bioMessages = ["Just some guy on the internet!", "Just live a little!"];
  const [bioText, setBioText] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // HTML5 Web Audio API Visualizer References
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Custom Cursor mouse move handling
  useEffect(() => {
    let currentX = -100;
    let currentY = -100;
    let currentScale = 1;

    const updateCursorPosition = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) scale(${currentScale})`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      currentX = e.clientX;
      currentY = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.display = "block";
      }
      if (glowRef.current) {
        glowRef.current.style.display = "block";
      }
      updateCursorPosition();
    };

    const handleMouseDown = () => {
      currentScale = 0.85;
      updateCursorPosition();
    };

    const handleMouseUp = () => {
      currentScale = 1;
      updateCursorPosition();
    };

    const handleMouseLeave = () => {
      if (cursorRef.current) cursorRef.current.style.display = "none";
      if (glowRef.current) glowRef.current.style.display = "none";
    };

    const handleMouseEnter = () => {
      if (cursorRef.current) cursorRef.current.style.display = "block";
      if (glowRef.current) glowRef.current.style.display = "block";
    };

    // Always register cursor listeners so hybrid laptop mouse/trackpads work
    document.body.classList.add("custom-cursor-active");
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      document.body.classList.remove("custom-cursor-active");
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  // Sync Video Audio, Background Music, and Mute State
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 0;
      videoRef.current.muted = true;
    }
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Guarantee initial reset/paused state on page load
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Handle Play on Start Click
  const startExperience = () => {
    setHasStarted(true);
    setIsPlaying(true);
    initVisualizer();
    if (
      audioContextRef.current &&
      audioContextRef.current.state === "suspended"
    ) {
      audioContextRef.current.resume();
    }

    // Explicitly align timeline to 0 at start
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
    }
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.muted = isMuted;
      audioRef.current.volume = volume;
    }

    // Play both simultaneously with bulletproof error handling
    try {
      if (videoRef.current) {
        const vPromise = videoRef.current.play();
        if (vPromise !== undefined) {
          vPromise.catch((err) => {
            console.warn("PerfectSync: Video play on start blocked or caught:", err);
          });
        }
      }
    } catch (err) {
      console.error("PerfectSync: Video play synchronous error caught:", err);
    }

    try {
      if (audioRef.current) {
        const aPromise = audioRef.current.play();
        if (aPromise !== undefined) {
          aPromise.catch((err) => {
            console.warn("PerfectSync: Audio play on start blocked or caught:", err);
          });
        }
      }
    } catch (err) {
      console.error("PerfectSync: Audio play synchronous error caught:", err);
    }
  };

  // Toggle Mute Handler
  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume > 0 ? prevVolume : 0.3);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolume(0);
    }
  };

  // Volume Slider Handler
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (newVol > 0) {
      setIsMuted(false);
      setPrevVolume(newVol);
    } else {
      setIsMuted(true);
    }
  };

  // Toggle playback state manually (Play/Pause)
  const togglePlay = () => {
    if (!videoRef.current) return;
    initVisualizer();
    if (
      audioContextRef.current &&
      audioContextRef.current.state === "suspended"
    ) {
      audioContextRef.current.resume();
    }
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => console.warn("Video error: ", e));
      }
      setIsPlaying(true);
    }
  };

  // Lockstep Video-Audio Master/Slave Synchronization System
  useEffect(() => {
    if (!hasStarted) return;

    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    let isSeekingSync = false;

    // Rule 1 & 4: Play/Pause state synchronization (Master drives Slave)
    const handlePlay = () => {
      if (isPlaying) {
        audio.muted = isMuted;
        audio.volume = volume;
        // Ensure starting alignment
        audio.currentTime = video.currentTime;
        audio.play().catch((err) => {
          console.warn("PerfectSync: Audio play blocked or delayed until interaction: ", err);
        });
      }
    };

    const handlePause = () => {
      audio.pause();
    };

    // Rule 2 & 3: Drift correction and buffering alignment
    const syncTimeTracker = () => {
      if (!isPlaying || isSeekingSync) return;
      const vTime = video.currentTime;
      const aTime = audio.currentTime;
      
      // If we've drifted by more than 0.1s, sync timelines immediately
      if (Math.abs(aTime - vTime) > 0.1) {
        audio.currentTime = vTime;
      }
    };

    const handleWaiting = () => {
      // Rule 3: Buffer freeze - Freeze the audio instantly if the video is waiting/buffering
      audio.pause();
    };

    const handlePlaying = () => {
      // Rule 3: Buffer catch-up - Snap the audio to video timestamp and resume play
      if (isPlaying) {
        audio.currentTime = video.currentTime;
        audio.muted = isMuted;
        audio.volume = volume;
        audio.play().catch((err) => {
          console.warn("PerfectSync: Audio play resumed with video: ", err);
        });
      }
    };

    const handleSeeking = () => {
      isSeekingSync = true;
      audio.pause();
    };

    const handleSeeked = () => {
      audio.currentTime = video.currentTime;
      isSeekingSync = false;
      if (isPlaying && !video.paused) {
        audio.play().catch(() => {});
      }
    };

    // Tab visibility recovery handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Enforce play states on wake-up
        if (isPlaying) {
          audio.currentTime = video.currentTime;
          if (video.paused) {
            video.play().catch(() => {});
          }
          if (audio.paused) {
            audio.play().catch(() => {});
          }
        } else {
          video.pause();
          audio.pause();
        }
      }
    };

    // Video events
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", syncTimeTracker);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("seeked", handleSeeked);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Tight secondary interval check to catch any background or passive drift (every 500ms)
    const driftCheckInterval = setInterval(syncTimeTracker, 500);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", syncTimeTracker);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("seeked", handleSeeked);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(driftCheckInterval);
    };
  }, [hasStarted, isPlaying, isMuted, volume]);

  // Trigger Portrait Spin
  const handleAvatarClick = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
    }, 600);
  };

  // Typewriter Bio Logic
  useEffect(() => {
    if (!hasStarted) return;

    let timer: NodeJS.Timeout;
    const currentMessage = bioMessages[messageIndex];

    if (!isDeleting && charIndex < currentMessage.length) {
      timer = setTimeout(() => {
        setBioText(currentMessage.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 100);
    } else if (isDeleting && charIndex > 0) {
      timer = setTimeout(() => {
        setBioText(currentMessage.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      }, 50);
    } else if (charIndex === currentMessage.length && !isDeleting) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2500);
    } else if (charIndex === 0 && isDeleting) {
      setIsDeleting(false);
      setMessageIndex((prev) => (prev + 1) % bioMessages.length);
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, messageIndex, hasStarted]);

  // Blinking cursor
  useEffect(() => {
    const blinkTimer = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(blinkTimer);
  }, []);

  // Web Audio Visualizer API Setup
  const initVisualizer = () => {
    if (audioContextRef.current || !audioRef.current) return;
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64; // Discrete 32 frequency streams
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      source.connect(analyser);
      analyser.connect(ctx.destination);
    } catch (err) {
      console.warn(
        "Failed to initiate canvas frequency analyser. Audio must be active: ",
        err,
      );
    }
  };

  // Canvas visualizer spectra render loop
  useEffect(() => {
    if (!hasStarted) return;

    let animationId: number;

    const draw = () => {
      // Draw static flat idle lines and halt animation requests when music is paused to save CPU/GPU cycles
      if (!isPlaying) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const bufferLength = 16;
            const barWidth = (width / bufferLength) * 1.55;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
              const barHeight = 2; // Accent base plate line
              const gradient = ctx.createLinearGradient(0, height, 0, 0);
              gradient.addColorStop(0, "rgba(99, 102, 241, 0.2)"); // Indigo
              gradient.addColorStop(1, "rgba(6, 182, 212, 0.4)");  // Cyan
              ctx.fillStyle = gradient;

              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(
                  x,
                  height - barHeight,
                  barWidth - 1.5,
                  barHeight,
                  1,
                );
              } else {
                ctx.rect(x, height - barHeight, barWidth - 1.5, barHeight);
              }
              ctx.fill();
              x += barWidth;
            }
          }
        }
        return;
      }

      animationId = requestAnimationFrame(draw);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const analyser = analyserRef.current;
      const bufferLength = analyser ? analyser.frequencyBinCount : 16;
      const dataArray = new Uint8Array(bufferLength);

      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      // Draw bars
      const barWidth = (width / bufferLength) * 1.55;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // Fallback to organic wave if AudioContext blocked, otherwise use true node frequencies
        const value = analyser
          ? dataArray[i]
          : Math.sin(Date.now() / 140 + i * 0.7) * 45 + 50;

        // Draw frequency bands
        barHeight = (value / 255) * height * 0.9;
        if (barHeight < 2) barHeight = 2; // draw constant elegant base plate

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, "rgba(99, 102, 241, 0.45)");  // Indigo-500
        gradient.addColorStop(0.5, "rgba(6, 182, 212, 0.85)"); // Cyan-500
        gradient.addColorStop(1, "rgba(34, 211, 238, 1)");     // Cyan-400

        ctx.fillStyle = gradient;

        const bx = x;
        const by = height - barHeight;
        const bw = barWidth - 1.5;
        const bh = barHeight;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bx, by, bw, bh, 1);
        } else {
          ctx.rect(bx, by, bw, bh);
        }
        ctx.fill();

        x += barWidth;
      }
    };

    draw();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [hasStarted, isPlaying]);

  // Discord Presence Sync via live API
  useEffect(() => {
    if (!discordId) return;

    const fetchStatus = () => {
      fetch(`https://api.lanyard.rest/v1/users/${discordId}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Presence server offline");
        })
        .then((json) => {
          if (json.success && json.data) {
            const d = json.data;
            const status = d.discord_status || "offline";

            let customStatus = "";
            let game = "";

            // Find custom text status
            const customActivity = d.activities?.find(
              (act: any) => act.type === 4,
            );
            if (customActivity) {
              customStatus = customActivity.state || "";
              if (customActivity.emoji?.name) {
                customStatus = `${customActivity.emoji.name} ${customStatus}`;
              }
            }

            // Find active gameplay or app
            const gameActivity = d.activities?.find(
              (act: any) => act.type === 0,
            );
            if (gameActivity) {
              game = gameActivity.name || "";
            } else if (d.listening_to_spotify) {
              game = "Listening to Spotify";
            }

            setDiscordStatus({
              status,
              customStatus,
              game,
              avatar: d.discord_user?.avatar
                ? `https://cdn.discordapp.com/avatars/${d.discord_user.id}/${d.discord_user.avatar}.png`
                : "",
              tag: d.discord_user?.username || "",
              raw: d,
            });
          }
        })
        .catch((err) => {
          console.warn(
            "Discord presence retrieval failed (safe offline fallback active):",
            err,
          );
        });
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // Live sync updates every 15s
    return () => clearInterval(interval);
  }, [discordId]);

  // List of Social links from paste bin
  const socialLinks: SocialLink[] = [
    {
      id: "youtube",
      name: "YouTube",
      url: "https://youtube.com/@duziy",
      icon: Youtube,
      iconSlug: "youtube",
      color: "hover:text-[#FF0000]",
      category: "media",
    },
    {
      id: "kick",
      name: "Kick",
      url: "https://kick.com/duziy",
      icon: Tv,
      iconSlug: "kick",
      color: "hover:text-[#53FC18]",
      category: "streaming",
    },
    {
      id: "twitch",
      name: "Twitch",
      url: "https://twitch.tv/realduziy",
      icon: Twitch,
      iconSlug: "twitch",
      color: "hover:text-[#9146FF]",
      category: "streaming",
    },
    {
      id: "tiktok",
      name: "TikTok",
      url: "https://tiktok.com/@duziy",
      icon: Clapperboard,
      iconSlug: "tiktok",
      color: "hover:text-[#01F2FF]",
      category: "media",
    },
    {
      id: "instagram",
      name: "Instagram",
      url: "https://instagram.com/realduziy/",
      icon: Instagram,
      iconSlug: "instagram",
      color: "hover:text-[#E1306C]",
      category: "social",
    },
    {
      id: "twitter",
      name: "Twitter / X",
      url: "https://x.com/realduziy",
      icon: Twitter,
      iconSlug: "x",
      color: "hover:text-stone-100",
      category: "social",
    },
    {
      id: "github",
      name: "GitHub",
      url: "https://github.com/realduziy",
      icon: Github,
      iconSlug: "github",
      color: "hover:text-stone-300",
      category: "gaming",
    },
    {
      id: "soundcloud",
      name: "SoundCloud",
      url: "https://soundcloud.com/duziy",
      icon: AudioLines,
      iconSlug: "soundcloud",
      color: "hover:text-[#FF5500]",
      category: "media",
    },
    {
      id: "roblox",
      name: "Roblox",
      url: "https://roblox.com/users/1306548829/profile",
      icon: Gamepad,
      iconSlug: "roblox",
      color: "hover:text-[#FF0000]",
      category: "gaming",
    },
    {
      id: "reddit",
      name: "Reddit",
      url: "https://reddit.com/user/_duziy_/",
      icon: MessageCircle,
      iconSlug: "reddit",
      color: "hover:text-[#FF4500]",
      category: "social",
    },
    {
      id: "namemc",
      name: "NameMC (Skins)",
      url: "https://namemc.com/profile/duziy.1",
      icon: Box,
      iconSlug: "namemc",
      color: "hover:text-[#53FC18]",
      category: "gaming",
    },
    {
      id: "steam",
      name: "Steam",
      url: "https://steamcommunity.com/id/duziy",
      icon: Gamepad2,
      iconSlug: "steam",
      color: "hover:text-[#00ADEE]",
      category: "gaming",
    },
    {
      id: "telegram",
      name: "Telegram",
      url: "https://t.me/duziy",
      icon: Send,
      iconSlug: "telegram",
      color: "hover:text-[#24A1DE]",
      category: "social",
    },
  ];

  // Computed active properties using active Lanyard dynamic state
  const currentAvatarUrl =
    discordStatus?.avatar && !discordAvatarError
      ? discordStatus.avatar
      : "/assets/profile.jpg";

  const activeStatus = discordStatus?.status || "offline";
  const activeCustomStatus = discordStatus?.customStatus || "";
  const activeGame = discordStatus?.game || "";
  const activeUsername = discordStatus?.tag || "duziy";

  return (
    <div className="relative min-h-screen bg-[#020205] text-white overflow-x-hidden font-mono selection:bg-purple-500/30 selection:text-white">
      {/* 1. Custom Pointer Cursor */}
      <div
        ref={cursorRef}
        id="custom-cursor-container"
        className="fixed top-0 left-0 pointer-events-none z-[20000] select-none will-change-transform"
        style={{
          transform: "translate3d(-100px, -100px, 0) translate(-50%, -50%)",
          display: "none",
        }}
      >
        <img
          src="/assets/custom_cursor.png"
          alt="crosshair cursor"
          className="w-10 h-10 object-contain max-w-none"
          onLoad={(e) => {
            const container = e.currentTarget.parentElement;
            if (container) {
              const fallback = container.querySelector(
                "#crosshair-fallback",
              ) as HTMLElement;
              if (fallback) fallback.style.display = "none";
            }
          }}
          onError={(e) => {
            const imgEl = e.currentTarget as HTMLElement;
            imgEl.style.display = "none";
            const container = imgEl.parentElement;
            if (container) {
              const fallback = container.querySelector(
                "#crosshair-fallback",
              ) as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }
          }}
        />
        {/* Stunning High Fidelity CSS Fallback Crosshairs Reticle */}
        <div
          id="crosshair-fallback"
          className="relative w-6 h-6 flex items-center justify-center mix-blend-difference"
          style={{ display: "flex" }}
        >
          {/* Centered precision point */}
          <div className="w-[3px] h-[3px] rounded-full bg-white" />
          {/* Top reticle line */}
          <div className="absolute top-0 w-[1.5px] h-1.5 bg-white/70" />
          {/* Bottom reticle line */}
          <div className="absolute bottom-0 w-[1.5px] h-1.5 bg-white/70" />
          {/* Left reticle line */}
          <div className="absolute left-0 w-1.5 h-[1.5px] bg-white/70" />
          {/* Right reticle line */}
          <div className="absolute right-0 w-1.5 h-[1.5px] bg-white/70" />
        </div>
      </div>

      {/* 2. Video Player & Audio System */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-black">
        {/* Dynamic Cursor-following Cosmic Glow Aura */}
        <div
          ref={glowRef}
          className="absolute top-0 left-0 pointer-events-none z-[1] select-none rounded-full w-[450px] h-[450px] bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-transparent blur-[110px] will-change-transform opacity-80"
          style={{
            transform: "translate3d(-500px, -500px, 0)",
            display: "none",
          }}
        />
        <video
          ref={videoRef}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoError ? "opacity-0" : "opacity-100"
          }`}
          src="/assets/background.mp4"
          loop
          playsInline
          muted={true}
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          onError={(e) => {
            const mediaError = e.currentTarget.error;
            console.error(
              "Background video failed to load! Error details:",
              mediaError ? { code: mediaError.code, message: mediaError.message } : "Unknown media error"
            );
            console.log(
              "No custom /assets/background.mp4 video found, system utilizing high fidelity cosmic fallback.",
            );
            setIsVideoError(true);
          }}
        />
        <audio
          ref={audioRef}
          src="/assets/background_music.mp3"
          loop
          muted={isMuted}
        />

        {/* Stellar Cosmic Fallback Background if video is unavailable or erroring */}
        {isVideoError && (
          <div className="absolute inset-0 bg-ambient-glow opacity-80 bg-[#03020c]">
            {/* Elegant Background Stars Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black opacity-100" />
            <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px] top-1/4 left-1/4" />
            <div className="absolute w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[80px] bottom-1/4 right-1/4" />
          </div>
        )}
      </div>

      {/* 3. Gate Screen (Epilepsy & Autoplay Entry Warning) */}
      <AnimatePresence>
        {!hasStarted && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            id="start-screen"
            className="fixed inset-0 w-full h-full z-[10000] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl select-none text-center px-6"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="max-w-md p-10 rounded-2xl border border-stone-900 bg-stone-950/75 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_30px_rgba(34,211,238,0.04)] space-y-6"
            >
              <div className="w-16 h-16 rounded-full border border-red-500/15 bg-red-500/5 flex items-center justify-center mx-auto text-red-400/90 shadow-[0_0_15px_rgba(239,68,68,0.05)] animate-pulse">
                <Volume2 className="w-7 h-7" />
              </div>

              <div className="space-y-3">
                <h2 className="text-sm tracking-[0.25em] text-red-400 font-mono font-black uppercase">
                  Epilepsy Warning
                </h2>
                <p className="text-[11px] font-mono text-stone-400 leading-relaxed uppercase tracking-widest max-w-[32ch] mx-auto">
                  This website includes looping media, animated space effects,
                  audio visual triggers, and lights.
                </p>
              </div>

              <div className="h-[1px] bg-stone-900 w-full" />

              <motion.div
                onClick={startExperience}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="text-cyan-400 hover:text-cyan-300 font-mono text-xs font-black tracking-[0.2em] bg-cyan-500/5 hover:bg-cyan-500/15 border border-cyan-500/15 hover:border-cyan-400/60 hover:shadow-[0_0_12px_rgba(34,211,238,0.25)] px-6 py-3.5 rounded-full uppercase transition-all duration-300 cursor-pointer active:scale-95"
              >
                Enter Experience
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Main Page App Wrapper */}
      {hasStarted && (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6 z-10 select-none">
          <AnimatePresence mode="wait">
            {/* View A: HOME PAGE */}
            {activeTab === "home" && (
              <motion.div
                key="home-page"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-[460px] sm:max-w-[530px] md:max-w-[550px] px-2 sm:px-0 relative"
              >
                {/* Ambient Card Background Glow Aura */}
                <div
                  className={`absolute -inset-4 rounded-[2.5rem] blur-2xl opacity-20 transition-all duration-500 pointer-events-none ${
                    hoveredLink
                      ? avatarGlowColors[hoveredLink]
                      : "bg-cyan-500/10"
                  }`}
                />

                {/* Main Glass Profile Card block with interactive ambient shadow and border */}
                <div
                  style={{
                    transition: "border-color 0.5s ease",
                  }}
                  className={`glass-panel w-full p-8 rounded-2xl flex flex-col items-center text-center gap-4.5 relative shadow-xl transition-all duration-500 ${
                    hoveredLink
                      ? glowColors[hoveredLink]
                      : "shadow-[0_25px_60px_rgba(34,211,238,0.12)] border-cyan-500/25"
                  }`}
                >
                  {/* Dynamic Scalable Header Bar containing About Me Action & View Counter */}
                  <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 border-b border-white/5 pb-4 mb-2 w-[100%] max-w-full">
                    {/* About Me Action Component */}
                    <button
                      onClick={() => setActiveTab("about")}
                      className="w-full max-w-[200px] sm:max-w-[220px] md:w-auto group cursor-pointer inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-stone-300 font-sans tracking-wide hover:border-cyan-500/30 hover:bg-white/[0.08] hover:text-cyan-300 transition-all duration-300 pointer-events-auto shadow-sm select-none text-xs sm:text-xs md:text-xs lg:text-sm"
                    >
                      <User className="w-3.5 h-3.5 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 text-stone-400 group-hover:text-cyan-400 transition-colors" />
                      <span className="font-semibold px-0.5">About Me</span>
                    </button>

                    {/* Minimalist Proportional View Counter Component */}
                    {visitorCount !== null && (
                      <div className="w-full max-w-[200px] sm:max-w-[220px] md:w-auto flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg border border-white/10 bg-white/[0.03] text-stone-300 font-sans tracking-wide select-none shadow-sm backdrop-blur-sm">
                        <Eye className="w-3.5 h-3.5 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 text-cyan-400 animate-pulse shrink-0" />
                        <div className="flex items-baseline gap-1.5 leading-none">
                          <span className="text-[9px] md:text-[9.5px] lg:text-[10px] text-stone-500 uppercase tracking-widest font-black shrink-0">
                            Views:
                          </span>
                          <span className="font-extrabold text-[#06b6d4] text-xs sm:text-xs md:text-sm lg:text-base">
                            {visitorCount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile Picture Orbit & Spinner block */}
                  <div className="relative w-28 h-28 mt-2">
                    {/* Dynamic outer breathing background glow that adapts to hovered links */}
                    <div
                      className={`absolute -inset-2.5 rounded-full blur-md opacity-35 transition-all duration-500 pointer-events-none ${
                        hoveredLink
                          ? avatarGlowColors[hoveredLink]
                          : "bg-cyan-500/15"
                      }`}
                    />

                    {/* Inner spinning orbits (double ring structure) */}
                    <div
                      className={`absolute inset-0 rounded-full border border-white/15 border-r-indigo-400/40 border-l-cyan-400/50 ${
                        isSpinning
                          ? "animate-[spin_0.6s_ease-out]"
                          : "animate-[spin_12s_linear_infinite]"
                      }`}
                    />
                    <div
                      className={`absolute -inset-1 rounded-full border border-dashed border-white/5 border-t-cyan-400/35 border-b-indigo-400/25 ${
                        isSpinning
                          ? "animate-[spin_0.6s_reverse_ease-out]"
                          : "animate-[spin_18s_linear_infinite_reverse]"
                      }`}
                    />

                    {/* Inner avatar alignment */}
                    <div className="absolute inset-1.5 rounded-full overflow-hidden border border-white/10 bg-[#090810]">
                      {!avatarError ? (
                        <img
                          src={currentAvatarUrl}
                          alt="duziy Profile"
                          onError={() => {
                            if (currentAvatarUrl !== "/assets/profile.jpg") {
                              setDiscordAvatarError(true);
                            } else {
                              setAvatarError(true);
                            }
                          }}
                          onClick={handleAvatarClick}
                          className={`w-full h-full object-cover cursor-pointer transition-transform duration-500 hover:scale-110 active:scale-95 ${
                            isSpinning ? "pointer-events-none" : ""
                          }`}
                        />
                      ) : (
                        // Stunning elegant generative SVG initials fallback in case assets/profile.jpg is missing
                        <div
                          onClick={handleAvatarClick}
                          className="w-full h-full flex items-center justify-center select-none font-bold text-3xl cursor-pointer bg-gradient-to-tr from-violet-600 via-indigo-700 to-cyan-500 hover:brightness-110 active:brightness-90 transition-all text-white"
                        >
                          d
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Developer Name & Info */}
                  <div className="space-y-1.5 w-full">
                    <h1 className="text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-stone-100 via-stone-300 to-purple-300 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">
                      duziy
                    </h1>

                    {/* Typewriter bio section - tight layout */}
                    <div className="h-6 flex items-center justify-center px-4">
                      <p className="text-sm text-stone-300 tracking-wide leading-relaxed font-mono">
                        {bioText}
                        <span
                          className={`inline-block w-2 ml-1 bg-cyan-400 text-cyan-400 ${cursorVisible ? "opacity-100" : "opacity-0"}`}
                        >
                          |
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Hover Cap Indicator Description */}
                  <div className="h-6 flex items-center justify-center text-[10px] tracking-widest uppercase w-full">
                    {hoveredLink && (
                      <span className="flex items-center gap-1.5 text-stone-300 tracking-widest font-mono text-[9px] bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full uppercase">
                        <ExternalLink className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                        <span>
                          Navigate to{" "}
                          <strong className="text-cyan-300 font-bold">
                            {hoveredLink}
                          </strong>
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Interactive Button Grid (13 social media icons) with glossy high-fidelity circular buttons */}
                  <div className="grid grid-cols-5 gap-3 md:gap-3.5 pt-1.5 w-full justify-items-center">
                    {socialLinks.map((link, index) => {
                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onMouseEnter={() => setHoveredLink(link.name)}
                          onMouseLeave={() => setHoveredLink(null)}
                          className={`w-[52px] h-[52px] rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/20 pointer-events-auto flex items-center justify-center text-stone-400/80 transition-all duration-300 ${link.color} hover:drop-shadow-[0_0_8px_currentColor] transform hover:scale-115 hover:-translate-y-0.5 active:scale-95 shadow-sm ${
                            index === 10 ? "col-start-2" : ""
                          }`}
                          aria-label={link.name}
                        >
                          <span className="pointer-events-none w-[22px] h-[22px] flex items-center justify-center">
                            <SvgBrandIcon
                              slug={link.iconSlug || link.id}
                              fallback={link.icon}
                              className="w-full h-full flex items-center justify-center transition-all duration-200"
                            />
                          </span>
                        </a>
                      );
                    })}
                  </div>

                  {/* High fidelity Discord Presence Console (Spotify / Gaming / Terminal Idle fallback) */}
                  <DiscordPresenceWidget discordStatus={discordStatus} />

                  {/* Recently Played Cache integration */}
                  <RecentlyPlayedWidget
                    songs={recentlyPlayedSongs}
                    topSongs={topPlayedSongs}
                  />
                </div>
              </motion.div>
            )}

            {/* View B: ABOUT ME PAGE */}
            {activeTab === "about" && (
              <motion.div
                key="about-page"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl px-4 md:px-8 my-4 md:my-10 relative mx-auto"
              >
                {/* Ambient Card Background Glow Aura */}
                <div className="absolute -inset-4 rounded-[2.5rem] blur-3xl opacity-15 bg-cyan-500/10 transition-all duration-500 pointer-events-none" />

                {/* About Box Glass Container with responsive padding */}
                <div className="glass-panel w-full p-5 md:p-8 rounded-2xl relative shadow-[0_25px_60px_rgba(34,211,238,0.12)] border-cyan-500/25 transition-all duration-500 hover:shadow-[0_35px_70px_rgba(34,211,238,0.18)] hover:border-cyan-500/35">
                  {/* Top back actions & Title row merged to save space */}
                  <div className="flex items-center gap-4 mb-5 md:mb-6 border-b border-white/10 pb-3.5 md:pb-4">
                    <button
                      onClick={() => setActiveTab("home")}
                      className="group pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-cyan-500/30 hover:text-cyan-200 text-xs md:text-sm text-stone-200 tracking-wider uppercase transition-all duration-200"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-stone-400 group-hover:text-cyan-400 group-hover:-translate-x-0.5 transition-all" />
                      <span>Back</span>
                    </button>

                    <h2 className="text-lg md:text-xl font-extrabold tracking-widest uppercase text-stone-200">
                      About Me
                    </h2>
                  </div>

                  {/* Redesigned 2-Column Responsive Compact Grid with responsive gap */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 text-stone-300">
                    {/* Left Column: Who am I & Contact Details */}
                    <div className="space-y-4 md:space-y-6">
                      {/* Section 1: Who am I */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 border-l-2 border-purple-500/70 pl-2">
                          <Terminal className="w-4 h-4 md:w-4.5 md:h-4.5 text-purple-400" />
                          <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-200">
                            Who am I
                          </h3>
                        </div>
                        <div className="space-y-3 text-xs md:text-sm leading-relaxed text-stone-400 font-sans tracking-wide">
                          <p className="max-w-[55ch] md:max-w-[65ch]">
                            Hey there! I'm{" "}
                            <strong className="text-white font-mono">
                              duziy
                            </strong>
                            , an independent creator and developer dedicated to
                            crafting immersive gaming experiences, composing
                            atmospheric audio, and learning something new every
                            single day.
                          </p>
                          <p className="max-w-[55ch] md:max-w-[65ch]">
                            Whether I'm configuring complex server-side systems
                            or design elements, making music, or producing new
                            digital content, I aim to create unique vibes and
                            meaningful connections.
                          </p>
                        </div>
                      </div>

                      {/* Section 2: Contact Info in clean table format instead of three bulky tiles */}
                      <div className="space-y-2 pt-2 md:pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 border-l-2 border-emerald-400/70 pl-2">
                          <Mail className="w-4 h-4 md:w-4.5 md:h-4.5 text-emerald-400" />
                          <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-200">
                            Contact
                          </h3>
                        </div>

                        <div className="space-y-1.5 text-xs md:text-sm">
                          <div className="flex items-center justify-between p-2 md:p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
                            <span className="text-stone-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                              Email
                            </span>
                            <a
                              href="mailto:duziyspam@gmail.com"
                              className="text-stone-300 hover:text-purple-400 hover:underline font-mono"
                            >
                              duziyspam@gmail.com
                            </a>
                          </div>

                          <div className="flex items-center justify-between p-2 md:p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
                            <span className="text-stone-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                              Discord
                            </span>
                            <span className="text-stone-300 font-mono">
                              @duziy
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 md:p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
                            <span className="text-stone-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                              Telegram
                            </span>
                            <a
                              href="https://t.me/duziy"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-stone-300 hover:text-purple-400 hover:underline font-mono"
                            >
                              t.me/duziy
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Projects & Skills */}
                    <div className="space-y-4 md:space-y-6">
                      {/* Section 3: Current Projects with smaller footprint */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 border-l-2 border-indigo-400/70 pl-2">
                          <CheckSquare className="w-4 h-4 md:w-4.5 md:h-4.5 text-indigo-400" />
                          <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-200">
                            Current Projects
                          </h3>
                        </div>

                        <ul className="grid grid-cols-2 gap-2 text-[11px] md:text-xs font-mono">
                          <li className="flex items-start gap-2 bg-white/[0.01] border border-white/5 p-2 md:p-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                            <Gamepad className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-bold text-stone-200 uppercase text-[9px] md:text-[10px] tracking-wider">
                                Minecraft Server
                              </p>
                              <p className="text-stone-400 mt-0.5">
                                Working on a Minecraft Server
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start gap-2 bg-white/[0.01] border border-white/5 p-2 md:p-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                            <Music className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-bold text-stone-200 uppercase text-[9px] md:text-[10px] tracking-wider">
                                Music Production
                              </p>
                              <p className="text-stone-400 mt-0.5">
                                Cooking up some new music
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start gap-2 bg-white/[0.01] border border-white/5 p-2 md:p-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                            <Laptop className="w-3.5 h-3.5 md:w-4 md:h-4 text-fuchsia-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-bold text-stone-200 uppercase text-[9px] md:text-[10px] tracking-wider">
                                Continuous Learning
                              </p>
                              <p className="text-stone-400 mt-0.5">
                                Learning new things every day
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start gap-2 bg-white/[0.01] border border-white/5 p-2 md:p-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                            <Video className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-bold text-stone-200 uppercase text-[9px] md:text-[10px] tracking-wider">
                                Content Creation
                              </p>
                              <p className="text-stone-400 mt-0.5">
                                Creating new content
                              </p>
                            </div>
                          </li>
                        </ul>
                      </div>

                      {/* Section 4: Skills list tags with compact typography */}
                      <div className="space-y-2 pt-2 md:pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 border-l-2 border-cyan-400/70 pl-2">
                          <Code className="w-4 h-4 md:w-4.5 md:h-4.5 text-cyan-400" />
                          <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-200">
                            Expertise
                          </h3>
                        </div>

                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                          {[
                            "Minecraft Server Configurator",
                            "Discord Community Management",
                            "Staff & General Management",
                            "Music Production",
                            "Content Creation",
                          ].map((skill, index) => (
                            <span
                              key={index}
                              className="bg-white/[0.02] border border-white/5 text-stone-300 hover:text-white hover:bg-white/[0.06] hover:border-white/20 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs tracking-tight transition-all"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* View C: ADMIN PORTAL PAGE */}
            {activeTab === "admin" && (
              <motion.div
                key="admin-page"
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-[460px] px-2 sm:px-0 relative"
              >
                {/* Ambient Card Background Glow Aura */}
                <div className="absolute -inset-4 rounded-[2.5rem] blur-2xl opacity-20 bg-cyan-400/10 transition-all duration-500 pointer-events-none" />

                <div className="glass-panel w-full p-8 rounded-2xl flex flex-col gap-6 relative shadow-[0_25px_60px_rgba(34,211,238,0.12)] border-cyan-500/25">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-cyan-400 rotate-90" />
                      <h2 className="text-xs font-bold font-mono tracking-widest uppercase text-stone-200">
                        Admin Portal
                      </h2>
                    </div>
                    <button
                      onClick={() => setActiveTab("home")}
                      className="group pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-cyan-500/30 hover:text-cyan-200 text-[10px] text-stone-300 tracking-wider uppercase transition-all duration-200 cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3 text-stone-400 group-hover:text-cyan-400" />
                      <span>Back to site</span>
                    </button>
                  </div>

                  {!isAdminAuthenticated ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          // Validate securely via primary server-side API auth route
                          const res = await fetch("/api/admin/auth", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              username: adminUsername,
                              password: adminPassword,
                            }),
                          });

                          if (res.ok) {
                            const data = await res.json();
                            if (data.authenticated) {
                              setIsAdminAuthenticated(true);
                              setAuthError("");
                              return;
                            }
                          }

                          setAuthError(
                            "Unauthorized Administrative access token or passcode mismatch",
                          );
                        } catch (err) {
                          console.error("Authentication exception:", err);
                          setAuthError(
                            "An error occurred during authentication. Please retry.",
                          );
                        }
                      }}
                      className="space-y-4"
                      autoComplete="off"
                      noValidate
                    >
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono tracking-widest uppercase text-stone-400">
                          Username
                        </label>
                        <input
                          type="text"
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          placeholder="admin"
                          required
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck="false"
                          className="w-full bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.06] border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono tracking-widest uppercase text-stone-400">
                          Security Passcode
                        </label>
                        <input
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••••••"
                          required
                          autoComplete="new-password"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck="false"
                          className="w-full bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.06] border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none transition-all"
                        />
                      </div>

                      {authError && (
                        <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-950/20 text-[10px] text-rose-400 font-mono tracking-wide leading-relaxed animate-pulse">
                          {authError}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full h-10 mt-2 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 active:scale-[0.98] text-cyan-300 text-xs font-bold tracking-widest uppercase rounded-lg transition-all cursor-pointer"
                      >
                        Authenticate Access
                      </button>
                    </form>
                  ) : (
                    /* Authenticated controls */
                    <div className="space-y-5">
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-500/25 bg-emerald-950/10 text-emerald-400">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                        </span>
                        <div className="min-w-0 text-left">
                          <p className="font-mono text-[10px] tracking-widest uppercase font-black">
                            Secure Admin Session Active
                          </p>
                          <p className="text-[9.5px] text-stone-400 font-sans mt-0.5">
                            Logged in as: {adminUsername}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Section 1: Core Snowflake ID */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold font-mono text-cyan-400 tracking-widest uppercase">
                            Discord Integration settings
                          </h3>
                          <p className="text-[10px] text-stone-400 leading-normal font-sans">
                            Configure the Discord User Snowflake ID for API
                            presence routing. This ID links the public status
                            widget live with your Discord activity.
                          </p>

                          {/* Beautiful informational card explaining Snowflake ID and Offline troubleshooting */}
                          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-2.5 text-left">
                            <div>
                              <p className="text-[10px] font-bold text-cyan-400 font-mono tracking-wider uppercase mb-0.5">
                                💡 What is a Snowflake ID?
                              </p>
                              <p className="text-[10px] text-stone-400 font-sans leading-relaxed">
                                A **Snowflake ID** is your account's permanent,
                                unique Discord identification number (e.g.{" "}
                                <code className="text-stone-200 font-mono bg-white/5 px-1 rounded">
                                  1025531959736860714
                                </code>
                                ). It is safe, public, and allows our live
                                status feed to fetch your status securely.
                              </p>
                              <p className="text-[10px] text-stone-400 font-sans leading-relaxed mt-1">
                                <strong className="text-stone-300">
                                  How to get your Snowflake ID:
                                </strong>{" "}
                                Enable **Developer Mode** in Discord Settings
                                -&gt; Advanced, then right-click your profile
                                picture and select **Copy User ID**. Paste it
                                below and click save.
                              </p>
                            </div>

                            <div className="border-t border-white/5 pt-2">
                              <p className="text-[10px] font-bold text-amber-400 font-mono tracking-wider uppercase mb-0.5">
                                ⚠️ Troubleshooting Discord & Spotify Status
                              </p>
                              <p className="text-[10px] text-stone-400 font-sans leading-relaxed">
                                if the status shows offline or you see errors,
                                review the following:
                              </p>
                              <ul className="list-disc pl-4 text-[10px] text-stone-400 font-sans space-y-1 mt-1 leading-relaxed">
                                <li>
                                  <strong className="text-stone-300">
                                    Register on Lanyard (Important):
                                  </strong>{" "}
                                  Lanyard tracks your presence by sharing a
                                  server with you. You must join the Lanyard
                                  Discord Server (at{" "}
                                  <a
                                    href="https://discord.gg/7B7u2uX"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-400 hover:underline"
                                  >
                                    discord.gg/7B7u2uX
                                  </a>
                                  ) to prevent the API from returning a{" "}
                                  <strong className="text-amber-300">
                                    404 Error
                                  </strong>
                                  .
                                </li>
                                <li>
                                  Ensure your Discord ID is connected to the
                                  status tracker bot on the integration server.
                                </li>
                                <li>
                                  Make sure{" "}
                                  <strong className="text-stone-300">
                                    "Share activity status by default"
                                  </strong>{" "}
                                  is turned ON in your Discord client settings
                                  under{" "}
                                  <code className="text-stone-200 font-mono bg-white/5 px-1 rounded">
                                    Settings &gt; Activity Privacy
                                  </code>
                                  .
                                </li>
                                <li>
                                  Ensure your Discord status is set to{" "}
                                  <span className="text-emerald-400">
                                    🟢 Online
                                  </span>
                                  ,{" "}
                                  <span className="text-amber-400">
                                    🟡 Idle
                                  </span>
                                  , or{" "}
                                  <span className="text-rose-400">
                                    🔴 Do Not Disturb
                                  </span>{" "}
                                  (not Invisible).
                                </li>
                              </ul>
                            </div>
                          </div>

                          <div className="space-y-3.5 pt-1">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold font-mono tracking-wider text-stone-400 block uppercase">
                                Discord Snowflake ID (Required for Status Widget)
                              </label>
                              <input
                                type="text"
                                value={tempDiscordId}
                                onChange={(e) =>
                                  setTempDiscordId(
                                    e.target.value.replace(/\D/g, ""),
                                  )
                                }
                                placeholder="e.g. 1025531959736860714"
                                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none transition-all"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold font-mono tracking-wider text-stone-400 block uppercase">
                                Discord Client ID (Optional)
                              </label>
                              <input
                                type="text"
                                value={tempDiscordClientId}
                                onChange={(e) =>
                                  setTempDiscordClientId(
                                    e.target.value.replace(/\D/g, ""),
                                  )
                                }
                                placeholder="Enter Discord Client ID (Application ID)"
                                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none transition-all"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold font-mono tracking-wider text-stone-400 block uppercase">
                                Discord Client Secret (Optional)
                              </label>
                              <input
                                type="password"
                                value={tempDiscordClientSecret}
                                onChange={(e) =>
                                  setTempDiscordClientSecret(e.target.value)
                                }
                                placeholder="Enter Discord Client Secret"
                                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none transition-all"
                              />
                            </div>

                            <button
                              onClick={() => {
                                if (tempDiscordId) {
                                  setDiscordId(tempDiscordId);
                                  localStorage.setItem(
                                    "discord_id",
                                    tempDiscordId,
                                  );
                                }
                                setDiscordClientId(tempDiscordClientId);
                                setDiscordClientSecret(tempDiscordClientSecret);
                                saveDiscordConfigToServer(
                                  tempDiscordId,
                                  tempDiscordClientId,
                                  tempDiscordClientSecret,
                                );
                              }}
                              className="w-full bg-cyan-500/15 border border-cyan-500/40 hover:bg-cyan-500/25 text-cyan-300 rounded-lg py-2.5 text-xs uppercase font-mono tracking-widest font-black transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                            >
                              Save Settings
                            </button>
                          </div>

                          {saveStatus && (
                            <p className="text-[10px] text-cyan-400 font-mono mt-1 text-left animate-pulse">
                              ✨ {saveStatus}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <p className="text-[9.5px] text-stone-500 font-mono uppercase tracking-wider">
                          Session Key: REST API
                        </p>
                        <button
                          onClick={() => {
                            setIsAdminAuthenticated(false);
                            setAdminPassword("");
                            setAuthError("");
                          }}
                          className="text-[10px] text-stone-400 font-bold font-mono tracking-widest uppercase hover:text-rose-400 border border-white/5 bg-white/[0.01] hover:bg-rose-500/10 hover:border-rose-500/20 px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 5. Sound Volume Media controllers bar */}
          <div className="mt-10 md:fixed md:bottom-6 md:left-6 md:mt-0 px-4.5 py-2.5 rounded-full flex items-center gap-3.5 md:gap-4 z-55 pointer-events-auto bg-stone-950/75 backdrop-blur-md border border-stone-900 hover:border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(34,211,238,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_30px_rgba(34,211,238,0.15)] select-none flex-wrap md:flex-nowrap justify-center transition-all duration-300 hover:scale-[1.015]">
            {/* Show active indicator (no track names or numbers) */}
            <div className="flex items-center gap-2.5 border-r border-stone-800/80 pr-3.5 shrink-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 transition-all duration-500 border border-black/20 ${isPlaying ? "bg-cyan-400 scale-110 shadow-[0_0_12px_#22d3ee] animate-pulse" : "bg-stone-600 scale-95 shadow-inner"}`}
              />
              <p className={`text-[9.5px] font-black font-mono tracking-[0.2em] uppercase leading-none transition-colors duration-300 ${isPlaying ? "text-cyan-400 drop-shadow-[0_0_2px_rgba(34,211,238,0.4)]" : "text-stone-500"}`}>
                {isPlaying ? "playing" : "paused"}
              </p>
            </div>

            {/* Media playback play/pause control */}
            <div className="flex items-center gap-1 border-r border-stone-800/80 pr-3.5 shrink-0">
              <button
                onClick={togglePlay}
                className="text-cyan-400 hover:text-cyan-300 cursor-pointer p-2 rounded-full bg-cyan-500/5 hover:bg-cyan-500/15 border border-cyan-500/15 hover:border-cyan-400/60 hover:shadow-[0_0_12px_rgba(34,211,238,0.25)] active:scale-90 transition-all duration-300 shrink-0 flex items-center justify-center h-8 w-8"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400 font-bold ml-0.5" />
                )}
              </button>
            </div>

            {/* Real-time HTML5 Canvas spectrum wave visualizer inside a subtle bezel */}
            <div className="flex items-center gap-1 border-r border-stone-800/80 pr-3.5 shrink-0 h-8 justify-center bg-stone-900/30 rounded-lg px-2">
              <canvas
                ref={canvasRef}
                width={56}
                height={16}
                className="w-14 h-4 opacity-95 filter drop-shadow-[0_0_3px_rgba(34,211,238,0.5)] transition-opacity duration-300"
                title="Spectrum frequency flow"
              />
            </div>

            {/* Volume mute toggle */}
            <button
              onClick={toggleMute}
              className="text-cyan-400 hover:text-cyan-300 cursor-pointer p-2 rounded-full bg-cyan-500/5 hover:bg-cyan-500/15 border border-cyan-500/15 hover:border-cyan-400/60 hover:shadow-[0_0_12px_rgba(34,211,238,0.25)] active:scale-90 transition-all duration-300 shrink-0 flex items-center justify-center h-8 w-8"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              )}
            </button>

            {/* Range slider */}
            <div className="flex items-center gap-2.5 shrink-0 bg-stone-900/20 px-2 py-1 rounded-lg">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-12 sm:w-16 volume-slider cursor-pointer outline-none"
              />
              <span className="text-[9.5px] font-mono font-black text-stone-400 tracking-wider w-9 text-right select-none shrink-0 transition-colors duration-300 hover:text-cyan-300">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
