import { SVGProps } from "react";
import {
  Tv,
  Clapperboard,
  AudioLines,
  Gamepad,
  Gamepad2,
  MessageCircle,
  Box,
  Send,
} from "lucide-react";
import { SocialLink } from "../types";

// Custom SVG components for brand icons removed in newer versions of lucide-react
export const YoutubeIcon = (props: SVGProps<SVGSVGElement>) => (
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

export const TwitchIcon = (props: SVGProps<SVGSVGElement>) => (
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

export const InstagramIcon = (props: SVGProps<SVGSVGElement>) => (
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

export const TwitterIcon = (props: SVGProps<SVGSVGElement>) => (
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

export const GithubIcon = (props: SVGProps<SVGSVGElement>) => (
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

// Brand glow configs
export const glowColors: Record<string, string> = {
  YouTube: "shadow-[0_20px_50px_rgba(255,0,0,0.18)] border-red-500/25",
  Kick: "shadow-[0_20px_50px_rgba(83,252,24,0.18)] border-emerald-400/25",
  Twitch: "shadow-[0_20px_50px_rgba(145,70,255,0.18)] border-indigo-400/25",
  TikTok: "shadow-[0_20px_50px_rgba(1,242,255,0.18)] border-cyan-400/25",
  Instagram: "shadow-[0_20px_50px_rgba(225,48,108,0.18)] border-pink-500/25",
  "Twitter / X": "shadow-[0_20px_50px_rgba(255,255,255,0.12)] border-stone-400/25",
  GitHub: "shadow-[0_20px_50px_rgba(255,255,255,0.12)] border-stone-400/25",
  SoundCloud: "shadow-[0_20px_50px_rgba(255,85,0,0.18)] border-orange-500/25",
  Roblox: "shadow-[0_20px_50px_rgba(255,0,0,0.18)] border-red-500/25",
  Reddit: "shadow-[0_20px_50px_rgba(255,69,0,0.18)] border-orange-600/25",
  "NameMC (Skins)": "shadow-[0_20px_50px_rgba(83,252,24,0.18)] border-emerald-400/25",
  Steam: "shadow-[0_20px_50px_rgba(0,173,238,0.18)] border-sky-400/25",
  Telegram: "shadow-[0_20px_50px_rgba(36,161,222,0.18)] border-sky-500/25",
};

export const avatarGlowColors: Record<string, string> = {
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

// Bio messages for typewriter typing
export const bioMessages = [
  "Just some guy on the internet!",
  "Just live a little!",
];

// Profile expertise skills list
export const expertiseSkills = [
  "Minecraft Server Configurator",
  "Discord Community Management",
  "Staff & General Management",
  "Music Production",
  "Content Creation",
];

// Project listing details
export interface ProjectItem {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const projectsList: ProjectItem[] = [
  {
    title: "Minecraft Server",
    description: "Working on a Minecraft Server",
    icon: "Gamepad",
    color: "text-cyan-400",
  },
  {
    title: "Music Production",
    description: "Cooking up some new music",
    icon: "Music",
    color: "text-orange-400",
  },
  {
    title: "Continuous Learning",
    description: "Learning new things every day",
    icon: "Laptop",
    color: "text-fuchsia-400",
  },
  {
    title: "Content Creation",
    description: "Creating new content",
    icon: "Video",
    color: "text-teal-400",
  },
];

// All Social links configured fully with SVG fallback icons
export const socialLinks: SocialLink[] = [
  {
    id: "youtube",
    name: "YouTube",
    url: "https://youtube.com/@duziy",
    icon: YoutubeIcon,
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
    icon: TwitchIcon,
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
    icon: InstagramIcon,
    iconSlug: "instagram",
    color: "hover:text-[#E1306C]",
    category: "social",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    url: "https://x.com/realduziy",
    icon: TwitterIcon,
    iconSlug: "x",
    color: "hover:text-stone-100",
    category: "social",
  },
  {
    id: "github",
    name: "GitHub",
    url: "https://github.com/realduziy",
    icon: GithubIcon,
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
