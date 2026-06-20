import { useState, useEffect, useRef, SVGProps } from "react";
import { motion, AnimatePresence } from "motion/react";
import DOMPurify from "dompurify";
import DiscordPresenceWidget from "./components/DiscordPresenceWidget";
import RecentlyPlayedWidget from "./components/RecentlyPlayedWidget";
import ProjectsTab from "./components/pages/ProjectsTab";
import GuestbookTab from "./components/pages/GuestbookTab";
import AdminTab from "./components/pages/AdminTab";
import { getFingerprint } from "./utils/visitor";
import { Track, DiscordStatus, DiscordActivity } from "./types";
import {
  glowColors,
  avatarGlowColors,
  bioMessages,
  socialLinks,
  expertiseSkills,
  projectsList,
} from "./data/bioData";
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

// Inline brand icon renderer utilizing Simple Icons SVGs for responsive size & color with XSS sanitization
function SvgBrandIcon({
  slug,
  fallback: Fallback,
  className,
}: {
  slug: string;
  fallback: React.ComponentType<{ className?: string }>;
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
        
        // Secure sanitization to completely eliminate XSS vectors
        const sanitized = DOMPurify.sanitize(cleaned, {
          USE_PROFILES: { svg: true },
        });
        setSvgContent(sanitized);
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

  const [discordStatus, setDiscordStatus] = useState<DiscordStatus | null>(null);
  const [isEditingDiscordId, setIsEditingDiscordId] = useState(false);
  const [tempDiscordId, setTempDiscordId] = useState(discordId);
  const [discordAvatarError, setDiscordAvatarError] = useState(false);

  // Reset avatar error when a new Discord ID is loaded
  useEffect(() => {
    setDiscordAvatarError(false);
  }, [discordId]);

  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [recentlyPlayedSongs, setRecentlyPlayedSongs] = useState<Track[]>([]);
  const [topPlayedSongs, setTopPlayedSongs] = useState<Track[]>([]);
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

  // Typewriter bio states (imported from bioData)
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

                <AdminTab
                  adminUsername={adminUsername}
                  setAdminUsername={setAdminUsername}
                  adminPassword={adminPassword}
                  setAdminPassword={setAdminPassword}
                  isAdminAuthenticated={isAdminAuthenticated}
                  setIsAdminAuthenticated={setIsAdminAuthenticated}
                  authError={authError}
                  setAuthError={setAuthError}
                  tempDiscordId={tempDiscordId}
                  setTempDiscordId={setTempDiscordId}
                  tempDiscordClientId={tempDiscordClientId}
                  setTempDiscordClientId={setTempDiscordClientId}
                  tempDiscordClientSecret={tempDiscordClientSecret}
                  setTempDiscordClientSecret={setTempDiscordClientSecret}
                  setDiscordId={setDiscordId}
                  setDiscordClientId={setDiscordClientId}
                  setDiscordClientSecret={setDiscordClientSecret}
                  saveDiscordConfigToServer={saveDiscordConfigToServer}
                  saveStatus={saveStatus}
                  onClose={() => setActiveTab("home")}
                />
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
