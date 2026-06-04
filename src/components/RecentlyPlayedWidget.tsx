import { useState } from "react";
import { motion } from "motion/react";
import { ListMusic, ExternalLink, Music } from "lucide-react";

interface Track {
  trackId: string;
  song: string;
  artist: string;
  album: string;
  albumArtUrl?: string;
  playedAt: number;
}

interface RecentlyPlayedWidgetProps {
  songs: Track[];
}

function AlbumArtWithFallback({ url, album }: { url?: string; album: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !url) {
    return (
      <div className="w-10 h-10 rounded-md border border-white/10 bg-white/5 flex items-center justify-center text-cyan-400 shrink-0">
        <Music className="w-5 h-5" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={album}
      onError={() => setHasError(true)}
      className="w-10 h-10 rounded-md border border-white/10 object-cover group-hover:scale-105 transition-transform shrink-0"
      referrerPolicy="no-referrer"
    />
  );
}

export default function RecentlyPlayedWidget({
  songs,
}: RecentlyPlayedWidgetProps) {
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

  const displayedSongs = songs.slice(0, 5); // Display the 5 most recent tracks

  return (
    <div className="w-full mt-4 p-4.5 rounded-xl relative border border-white/5 bg-[#07070b]/40 backdrop-blur-subtle transition-all duration-300">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3.5">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 tracking-wider uppercase font-mono">
          <ListMusic className="w-4 h-4 text-cyan-400" />
          Recently Played Songs
        </span>
        <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest font-semibold">
          Recent Cache
        </span>
      </div>

      {displayedSongs.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-stone-400 text-xs font-mono tracking-wider">
          <Music className="w-6 h-6 mb-2.5 text-stone-500 animate-pulse" />
          NO RECENT TRACKS IN CACHE
        </div>
      ) : (
        <div className="space-y-3">
          {displayedSongs.map((track, idx) => (
            <motion.div
              key={`${track.trackId}-${track.playedAt}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group flex items-center justify-between p-2.5 rounded-lg bg-white/[0.01] hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all duration-200"
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
                      href={`https://open.spotify.com/track/${track.trackId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-cyan-400 transition-all shrink-0"
                      title="Open on Spotify"
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
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
