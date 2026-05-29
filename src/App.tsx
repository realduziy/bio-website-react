import { useState, useEffect, useRef, SVGProps } from "react";
import { motion, AnimatePresence } from "motion/react";
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
} from "lucide-react";

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

export default function App() {
  // Navigation & Interactive States
  const [hasStarted, setHasStarted] = useState(false);
  const [activeTab, setActiveTabState] = useState<"home" | "about">(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      return path === "/about" ? "about" : "home";
    }
    return "home";
  });

  const setActiveTab = (tab: "home" | "about") => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      const newPath = tab === "about" ? "/about" : "/";
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, "", newPath);
      }
    }
  };

  useEffect(() => {
    document.title = "duziy | Profile";
    const handlePopState = () => {
      const path = window.location.pathname;
      setActiveTabState(path === "/about" ? "about" : "home");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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

  // Custom Cursor mouse move handling
  useEffect(() => {
    let currentX = -100;
    let currentY = -100;
    let currentScale = 1;

    const updateCursorPosition = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) scale(${currentScale})`;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      currentX = e.clientX;
      currentY = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.display = "block";
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
    };

    const handleMouseEnter = () => {
      if (cursorRef.current) cursorRef.current.style.display = "block";
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
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Handle Play on Start Click
  const startExperience = () => {
    setHasStarted(true);
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Autoplay was caught/blocked by browser sandbox: ", err);
        });
      }
    }
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = volume;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Background audio play blocked: ", err);
        });
      }
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

  return (
    <div className="relative min-h-screen bg-[#020205] text-white overflow-x-hidden font-mono selection:bg-purple-500/30 selection:text-white">
      {/* 1. Custom Pointer Cursor */}
      <div
        ref={cursorRef}
        id="custom-cursor-container"
        className="fixed top-0 left-0 pointer-events-none z-[9999] select-none will-change-transform"
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
          style={{ display: "none" }}
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
        <video
          ref={videoRef}
          className={`absolute min-w-full min-h-full object-cover transition-opacity duration-1000 ${
            isVideoError ? "opacity-0" : "opacity-40"
          }`}
          src="/assets/background.mp4"
          loop
          playsInline
          muted={isMuted}
          onError={() => {
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
          <div className="absolute inset-0 bg-ambient-glow opacity-80 animate-pulse duration-[8000ms] bg-[#03020c]">
            {/* Elegant Background Stars Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black opacity-100" />
            <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px] top-1/4 left-1/4 animate-bounce duration-[15000ms]" />
            <div className="absolute w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[80px] bottom-1/4 right-1/4 animate-pulse duration-[12000ms]" />
          </div>
        )}

        {/* Soft elegant shading block over backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-transparent to-black/80" />
      </div>

      {/* 3. Gate Screen (Epilepsy & Autoplay Entry Warning) */}
      <AnimatePresence>
        {!hasStarted && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            onClick={startExperience}
            id="start-screen"
            className="fixed inset-0 w-full h-full z-[10000] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl cursor-pointer select-none text-center px-6"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="max-w-md p-10 rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 rounded-full border border-red-500/30 bg-red-500/15 flex items-center justify-center mx-auto text-red-500 animate-pulse">
                <Volume2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl tracking-widest text-red-500/90 font-bold uppercase">
                  Epilepsy Warning
                </h2>
                <p className="text-sm text-gray-400">
                  This website includes looping media, animated space effects,
                  audio visual triggers, and lights.
                </p>
              </div>

              <div className="h-[1px] bg-white/10 w-full" />

              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                className="text-white bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/40 px-6 py-3 rounded-full text-base tracking-widest transition-all duration-300 transform active:scale-95"
              >
                CLICK TO START EXPERIENCE
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
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-[440px]"
              >
                {/* Floating "About Me" Pill Above Block */}
                <div className="flex justify-center mb-6">
                  <button
                    onClick={() => setActiveTab("about")}
                    className="group pointer-events-auto cursor-pointer inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/30 text-xs text-stone-200 tracking-widest uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 backdrop-blur-md shadow-lg"
                  >
                    <User className="w-3.5 h-3.5 text-stone-400 group-hover:text-indigo-400 transition-colors" />
                    <span>About Me</span>
                  </button>
                </div>

                {/* Main Glass Profile Card block */}
                <div className="glass-panel w-full p-8 rounded-2xl flex flex-col items-center text-center gap-4 relative">
                  {/* Profile Picture Orbit & Spinner block */}
                  <div className="relative w-28 h-28 mt-2">
                    {/* Subtle outer breathing background glow */}
                    <div className="absolute -inset-1 rounded-full bg-purple-500/5 blur-sm animate-pulse pointer-events-none" />

                    {/* Glowing rotating gradient orbit outline (No dotted/dashed lines) */}
                    <div
                      className={`absolute inset-0 rounded-full border border-white/20 border-r-indigo-400 border-l-purple-400 ${
                        isSpinning
                          ? "animate-[spin_0.6s_ease-out]"
                          : "animate-[spin_10s_linear_infinite]"
                      }`}
                    />

                    {/* Inner avatar alignment */}
                    <div className="absolute inset-1.5 rounded-full overflow-hidden border border-white/10 bg-[#090810]">
                      {!avatarError ? (
                        <img
                          src="/assets/profile.jpg"
                          alt="duziy Profile"
                          onError={() => setAvatarError(true)}
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
                          className={`inline-block w-2 ml-1 bg-stone-300 text-stone-300 ${cursorVisible ? "opacity-100" : "opacity-0"}`}
                        >
                          |
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Hover Cap Indicator Description */}
                  <div className="h-6 flex items-center justify-center text-[10px] tracking-widest text-[#aaa]/60 uppercase w-full">
                    {hoveredLink ? (
                      <span className="text-purple-300 animate-pulse flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 px-3 py-0.5 rounded-full">
                        <ExternalLink className="w-3 h-3" /> Visit {hoveredLink}
                      </span>
                    ) : (
                      <span className="text-transparent select-none">
                        &nbsp;
                      </span>
                    )}
                  </div>

                  {/* Interactive Button Grid (13 social media icons) */}
                  <div className="grid grid-cols-5 xs:grid-cols-5 sm:grid-cols-5 gap-x-1 gap-y-3.5 pt-1 w-full justify-items-center">
                    {socialLinks.map((link) => {
                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onMouseEnter={() => setHoveredLink(link.name)}
                          onMouseLeave={() => setHoveredLink(null)}
                          className={`w-14 h-14 social-btn-target pointer-events-auto flex items-center justify-center text-white/55 transition-all duration-300 ${link.color} transform hover:scale-125 hover:drop-shadow-[0_0_10px_currentColor] active:scale-90`}
                          aria-label={link.name}
                        >
                          <SvgBrandIcon
                            slug={link.iconSlug || link.id}
                            fallback={link.icon}
                            className="w-[26px] h-[26px] flex items-center justify-center transition-all duration-200"
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* View B: ABOUT ME PAGE */}
            {activeTab === "about" && (
              <motion.div
                key="about-page"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-2xl px-2 my-8"
              >
                {/* About Box Glass Container */}
                <div className="glass-panel w-full p-6 sm:p-10 rounded-2xl relative">
                  {/* Top back actions */}
                  <div className="flex justify-between items-center mb-8 border-b border-white/15 pb-4">
                    <button
                      onClick={() => setActiveTab("home")}
                      className="group pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs text-stone-200 tracking-wider uppercase transition-all duration-200"
                    >
                      <ChevronLeft className="w-4 h-4 text-stone-400 group-hover:text-white group-hover:-translate-x-0.5 transition-all" />
                      <span>Back</span>
                    </button>
                  </div>

                  <h2 className="text-xl sm:text-3xl font-extrabold tracking-widest uppercase mb-8 border-b border-white/10 pb-3 filter drop-shadow-sm text-stone-100">
                    About Me
                  </h2>

                  {/* About Grid Sections */}
                  <div className="space-y-8 text-stone-300">
                    {/* Section 1: Who am I */}
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-3 border-l-2 border-purple-500/70 pl-3">
                        <Terminal className="w-5 h-5 text-purple-400" />
                        <h3 className="text-base font-bold uppercase tracking-wider text-stone-200">
                          Who am I...
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed text-stone-400 font-sans tracking-wide">
                        Hey there! I'm{" "}
                        <strong className="text-white">duziy</strong>, just
                        another person on the internet who loves music, gaming,
                        creating content, and developing Minecraft servers.
                      </p>
                      <p className="text-sm leading-relaxed text-stone-400 font-sans tracking-wide">
                        I'm all about peace and love, and so should you!
                      </p>
                      <p className="text-sm leading-relaxed text-stone-400 font-sans tracking-wide">
                        I made this website to reach out to more people and
                        build a brand for myself.
                      </p>
                    </div>

                    {/* Section 2: Current Projects */}
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-3 border-l-2 border-indigo-400/70 pl-3">
                        <CheckSquare className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-base font-bold uppercase tracking-wider text-stone-200">
                          Current Projects
                        </h3>
                      </div>

                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                        <li className="flex items-start gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-lg hover:bg-white/[0.04] transition-colors">
                          <Gamepad className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-stone-200 uppercase">
                              Minecraft Server
                            </p>
                            <p className="text-stone-400 mt-0.5">
                              Currently configuration & backend tweaks.
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-lg hover:bg-white/[0.04] transition-colors">
                          <Music className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-stone-200 uppercase">
                              New Tracks
                            </p>
                            <p className="text-stone-400 mt-0.5">
                              Cooking up some new atmospheric music.
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-lg hover:bg-white/[0.04] transition-colors">
                          <Video className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-stone-200 uppercase">
                              Broadcasting
                            </p>
                            <p className="text-stone-400 mt-0.5">
                              Streaming across multiple platforms.
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-lg hover:bg-white/[0.04] transition-colors">
                          <Laptop className="w-4 h-4 text-fuchsia-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-stone-200 uppercase">
                              Skills Expansion
                            </p>
                            <p className="text-stone-400 mt-0.5">
                              Acquiring deeper knowledge daily.
                            </p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Section 3: Skills list tags */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-l-2 border-cyan-400/70 pl-3">
                        <Code className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-base font-bold uppercase tracking-wider text-stone-200">
                          Skills &amp; Expertise
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2.5 pt-1">
                        {[
                          "Minecraft Server Configurator",
                          "Discord Community Management",
                          "Staff & General Management",
                          "Music Production",
                          "Content Creation",
                        ].map((skill, index) => (
                          <span
                            key={index}
                            className="bg-white/[0.03] hover:bg-white/[0.08] hover:-translate-y-0.5 border border-white/10 hover:border-white/30 text-stone-300 hover:text-white px-4 py-2 rounded-full text-xs transition-all duration-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Section 4: Contact Me Info */}
                    <div className="space-y-3.5 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-3 border-l-2 border-emerald-400/70 pl-3">
                        <Send className="w-5 h-5 text-emerald-400 rotate-45" />
                        <h3 className="text-base font-bold uppercase tracking-wider text-stone-200">
                          Contact Me
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                        <div className="p-3.5 rounded-lg border border-white/5 bg-white/[0.01]">
                          <span className="block text-stone-500 uppercase font-bold text-[10px]">
                            Email Support
                          </span>
                          <a
                            href="mailto:duziyspam@gmail.com"
                            className="text-stone-200 hover:text-purple-400 hover:underline inline-flex items-center gap-1 mt-1 font-sans break-all"
                          >
                            duziyspam@gmail.com
                          </a>
                        </div>
                        <div className="p-3.5 rounded-lg border border-white/5 bg-white/[0.01]">
                          <span className="block text-stone-500 uppercase font-bold text-[10px]">
                            Discord ID
                          </span>
                          <span className="block text-stone-200 mt-1 font-sans">
                            @duziy
                          </span>
                        </div>
                        <div className="p-3.5 rounded-lg border border-white/5 bg-white/[0.01]">
                          <span className="block text-stone-500 uppercase font-bold text-[10px]">
                            Telegram Feed
                          </span>
                          <a
                            href="https://t.me/duziy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-200 hover:text-purple-400 hover:underline inline-flex items-center gap-1 mt-1 font-sans"
                          >
                            t.me/duziy{" "}
                            <ExternalLink className="w-3 h-3 text-stone-500" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 5. Sound Volume Media controllers bar */}
          <div className="glass-panel mt-10 md:fixed md:bottom-6 md:left-6 md:mt-0 px-4 py-2.5 rounded-full flex items-center gap-4.5 z-55 pointer-events-auto shadow-xl select-none">
            <button
              onClick={toggleMute}
              className="text-stone-300 hover:text-white cursor-pointer active:scale-90 transition-transform p-1 rounded-full hover:bg-white/10"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-purple-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-stone-200" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 sm:w-20 volume-slider cursor-pointer outline-none"
              />
              <span className="text-[9px] font-mono font-bold text-stone-400 tracking-wider w-8 text-right select-none">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
