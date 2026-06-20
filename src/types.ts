import { ComponentType } from "react";

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  category: "media" | "streaming" | "gaming" | "social" | "other";
  iconSlug?: string;
}

export interface Track {
  trackId: string;
  song: string;
  artist: string;
  album: string;
  albumArtUrl?: string;
  playedAt: number;
  playCount?: number;
}

// Discord activity types
export interface DiscordActivityAsset {
  large_image?: string;
  large_text?: string;
  small_image?: string;
  small_text?: string;
}

export interface DiscordActivityTimestamps {
  start?: number;
  end?: number;
}

export interface DiscordActivity {
  id: string;
  name: string;
  type: number;
  state?: string;
  details?: string;
  timestamps?: DiscordActivityTimestamps;
  assets?: DiscordActivityAsset;
  application_id?: string;
}

export interface DiscordStatus {
  status: "online" | "idle" | "dnd" | "offline";
  customStatus?: string;
  game?: string;
  avatar?: string;
  tag?: string;
  raw?: any;
}
