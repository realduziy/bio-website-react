import { useState, useEffect } from "react";
import { MessageSquare, ThumbsUp, Send, User, Calendar } from "lucide-react";

interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  hue: number; // For custom colorful identity avatars
}

export default function GuestbookTab() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [hue, setHue] = useState(() => Math.floor(Math.random() * 360));
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("client_guestbook_entries");
      if (saved) {
        setEntries(JSON.parse(saved));
      } else {
        // Default seed entries
        const defaults: GuestbookEntry[] = [
          {
            id: "1",
            name: "duziy",
            message: "Welcome to my personal links portal and guestbook! Feel free to leave a message. 💫",
            timestamp: Date.now() - 24 * 60 * 60 * 1000,
            hue: 280,
          },
          {
            id: "2",
            name: "anonymous",
            message: "Insane clean design! The audio spectrum and background are incredible. 🚀",
            timestamp: Date.now() - 3 * 60 * 60 * 1000,
            hue: 160,
          }
        ];
        setEntries(defaults);
        localStorage.setItem("client_guestbook_entries", JSON.stringify(defaults));
      }
    } catch (e) {
      console.warn("Could not retrieve guestbook storage:", e);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError("Please fill out both your name and message.");
      return;
    }
    if (name.length > 25) {
      setError("Name is too long (maximum 25 characters).");
      return;
    }
    if (message.length > 200) {
      setError("Message is too long (maximum 200 characters).");
      return;
    }

    setError("");
    const newEntry: GuestbookEntry = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      message: message.trim(),
      timestamp: Date.now(),
      hue,
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    try {
      localStorage.setItem("client_guestbook_entries", JSON.stringify(updated));
    } catch (err) {
      console.warn("Storage save failed:", err);
    }

    setName("");
    setMessage("");
    setHue(Math.floor(Math.random() * 360));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4 font-mono text-stone-300">
      <div className="flex items-center gap-2 border-l-2 border-pink-500/70 pl-2">
        <MessageSquare className="w-4 h-4 md:w-4.5 md:h-4.5 text-pink-400" />
        <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-stone-200">
          Guestbook Signatures
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Entry Form */}
        <form
          onSubmit={handleSubmit}
          className="md:col-span-2 p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] flex flex-col gap-3.5 text-left h-fit transition-all duration-300"
        >
          <p className="text-[10px] tracking-widest uppercase font-bold text-cyan-400">
            Sign the book
          </p>

          <div className="space-y-1">
            <label className="block text-[9px] uppercase text-stone-500 tracking-wider">
              Name / Handle
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2.5 text-stone-500">
                <User className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. explorer"
                required
                className="w-full bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.06] border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none transition-all placeholder:text-stone-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[9px] uppercase text-stone-500 tracking-wider">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave a friendly message or note..."
              required
              rows={3}
              maxLength={200}
              className="w-full bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.06] border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-all resize-none placeholder:text-stone-600"
            />
            <span className="block text-right text-[8px] text-stone-500">
              {message.length}/200
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase text-stone-500">Badge color:</span>
              <button
                type="button"
                onClick={() => setHue(Math.floor(Math.random() * 360))}
                className="w-4 h-4 rounded-full border border-white/20 shadow-inner cursor-pointer transition-transform hover:scale-110 active:scale-90"
                style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
                title="Shuffle Color"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-[10px] tracking-widest uppercase rounded-lg px-3.5 py-1.5 transition-all cursor-pointer font-black"
            >
              <span>Post</span>
              <Send className="w-2.5 h-2.5" />
            </button>
          </div>

          {error && (
            <p className="text-[9.5px] text-rose-400 mt-1.5 border border-rose-500/10 bg-rose-500/5 p-2 rounded-lg leading-snug">
              {error}
            </p>
          )}
        </form>

        {/* Entries Display */}
        <div className="md:col-span-3 space-y-2 max-h-[300px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-white/10 text-left">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs font-sans">
              No signatures yet. Be the first to post!
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-xl border border-white/5 bg-white/[0.015] hover:bg-white/[0.03] transition-colors relative flex items-start gap-3"
              >
                {/* Randomly Hue-colored avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 shadow-md font-sans text-xs font-black uppercase text-black"
                  style={{ backgroundColor: `hsl(${entry.hue}, 65%, 60%)` }}
                >
                  {entry.name.slice(0, 2)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between pb-1 gap-4 font-mono">
                    <span className="font-black text-stone-200 text-xs truncate uppercase">
                      {entry.name}
                    </span>
                    <span className="text-[8px] text-stone-500 flex items-center gap-1 shrink-0 font-sans tracking-tight">
                      <Calendar className="w-2.5 h-2.5" />
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-stone-300 leading-relaxed font-sans text-xs break-all whitespace-pre-wrap">
                    {entry.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
