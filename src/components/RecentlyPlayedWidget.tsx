import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ListMusic,
  ExternalLink,
  Music,
  Disc,
  Sparkles,
  Heart,
} from "lucide-react";

interface Track {
  trackId: string;
  song: string;
  artist: string;
  album: string;
  albumArtUrl?: string;
  playedAt: number;
  playCount?: number;
  url?: string;
  nowPlaying?: boolean;
}

interface RecentlyPlayedWidgetProps {
  songs: Track[];
  topSongs?: Track[];
}

function AlbumArtWithFallback({ url, album }: { url?: string; album: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !url) {
    return (
      <div className="w-10 h-10 rounded-md border border-white/10 bg-white/5 flex items-center justify-center text-cyan-400 shrink-0">
        <Music className="w-5 h-5 shrink-0" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={album}
      onError={() => setHasError(true)}
      className="w-10 h-10 rounded-md border border-white/10 object-cover group-hover:rotate-6 transition-transform shrink-0"
      referrerPolicy="no-referrer"
    />
  );
}

export default function RecentlyPlayedWidget({
  songs,
  topSongs = [],
}: RecentlyPlayedWidgetProps) {
  const [activeTab, setActiveTab] = useState<"recent" | "top">("recent");

  // Helper to format play times
  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  // Recently played shows up to 20 songs, scrollable
  const displayedRecentSongs = songs.slice(0, 20);

  return (
    <div className="w-full mt-4 p-4.5 rounded-xl border border-white/5 bg-[#07070b]/40 backdrop-blur-subtle transition-all duration-300">
      {/* Dynamic Widget Tab Switcher (Glass Design) */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3.5 animate-fade-in">
        <div className="flex gap-1 bg-white/[0.02] border border-white/5 p-1 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab("recent")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono tracking-wider font-bold transition-all uppercase cursor-pointer select-none ${
              activeTab === "recent"
                ? "bg-cyan-500/15 text-cyan-300 shadow-sm border border-cyan-500/20"
                : "text-stone-400 hover:text-stone-200 hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            Recently Played
          </button>
          <button
            onClick={() => setActiveTab("top")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono tracking-wider font-bold transition-all uppercase cursor-pointer select-none ${
              activeTab === "top"
                ? "bg-rose-500/15 text-rose-300 shadow-sm border border-rose-500/20"
                : "text-stone-400 hover:text-stone-200 hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Top Tracks
          </button>
        </div>

        <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest font-semibold hidden sm:inline select-none">
          {activeTab === "recent" ? "Real-time Tracker" : "Heavy Rotation"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "recent" ? (
          <motion.div
            key="recent-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className={`space-y-2.5 ${
              displayedRecentSongs.length > 5
                ? "max-h-[340px] overflow-y-auto pr-1 select-none custom-scroll-panel"
                : ""
            }`}
          >
            {displayedRecentSongs.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-stone-400 text-xs font-mono tracking-wider">
                <Disc className="w-7 h-7 mb-3 text-stone-600 animate-spin-slow animate-pulse" />
                <span>NO RECENTLY PLAYED TRACKS</span>
                <span className="text-[9px] text-stone-500 uppercase tracking-widest mt-1">
                  Scrobble music on Last.fm to stream your listening history
                </span>
              </div>
            ) : (
              displayedRecentSongs.map((track) => {
                const trackLink =
                  track.url ||
                  (track.trackId?.startsWith("http")
                    ? track.trackId
                    : `https://www.last.fm/search?q=${encodeURIComponent(
                        `${track.song} ${track.artist}`
                      )}`);

                return (
                  <div
                    key={`${track.trackId}-${track.playedAt}`}
                    className="group flex items-center justify-between p-2.5 rounded-lg bg-white/[0.01] hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all duration-200 animate-fade-in"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                      <AlbumArtWithFallback
                        url={track.albumArtUrl}
                        album={track.album}
                      />

                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-semibold text-stone-200 group-hover:text-cyan-300 transition-colors truncate block">
                            {track.song}
                          </span>
                          <a
                            href={trackLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-cyan-400 transition-all shrink-0 animate-fade-in"
                            title="Open track"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <span className="text-[11px] sm:text-xs text-stone-400 truncate block font-sans mt-0.5">
                          {track.artist
                            ? track.artist.replace(/;/g, ", ")
                            : "Unknown"}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-stone-400 shrink-0 select-none uppercase tracking-wider text-right font-medium">
                      {formatTimeAgo(track.playedAt)}
                    </span>
                  </div>
                );
              })
            )}
          </motion.div>
        ) : (
          <motion.div
            key="top-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className={`space-y-2.5 ${
              topSongs.length > 5
                ? "max-h-[340px] overflow-y-auto pr-1 select-none custom-scroll-panel"
                : ""
            }`}
          >
            {topSongs.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-stone-400 text-xs font-mono tracking-wider">
                <Heart className="w-7 h-7 mb-3 text-stone-600 animate-pulse" />
                <span>NO TOP TRACKS LOGGED YET</span>
                <span className="text-[9px] text-stone-500 uppercase tracking-widest mt-1 text-center max-w-xs">
                  Connect Last.fm username to display your top listened tracks
                </span>
              </div>
            ) : (
              topSongs.map((track) => {
                const trackLink =
                  track.url ||
                  (track.trackId?.startsWith("http")
                    ? track.trackId
                    : `https://www.last.fm/search?q=${encodeURIComponent(
                        `${track.song} ${track.artist}`
                      )}`);

                return (
                  <div
                    key={`${track.trackId}-${track.song}`}
                    className="group flex items-center justify-between p-2.5 rounded-lg bg-white/[0.01] hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all duration-200 animate-fade-in"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                      <AlbumArtWithFallback
                        url={track.albumArtUrl}
                        album={track.album}
                      />

                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-semibold text-stone-200 group-hover:text-rose-300 transition-colors truncate block">
                            {track.song}
                          </span>
                          <a
                            href={trackLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-400 transition-all shrink-0 animate-fade-in"
                            title="Open track"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <span className="text-[11px] sm:text-xs text-stone-400 truncate block font-sans mt-0.5">
                          {track.artist
                            ? track.artist.replace(/;/g, ", ")
                            : "Unknown"}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/15 text-[9px] font-mono text-rose-300 font-bold uppercase tracking-wide shrink-0">
                      <Sparkles className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                      <span>
                        {track.playCount !== undefined && track.playCount > 0
                          ? `${track.playCount} plays`
                          : "TOP"}
                      </span>
                    </span>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
