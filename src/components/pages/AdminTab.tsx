import { useState } from "react";
import { Terminal, ChevronLeft, Shield, Eye, HelpCircle, Gamepad2, Play } from "lucide-react";

interface AdminTabProps {
  adminUsername: string;
  setAdminUsername: (val: string) => void;
  adminPassword: string;
  setAdminPassword: (val: string) => void;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (val: boolean) => void;
  authError: string;
  setAuthError: (val: string) => void;
  tempDiscordId: string;
  setTempDiscordId: (val: string) => void;
  tempDiscordClientId: string;
  setTempDiscordClientId: (val: string) => void;
  tempDiscordClientSecret: string;
  setTempDiscordClientSecret: (val: string) => void;
  setDiscordId: (val: string) => void;
  setDiscordClientId: (val: string) => void;
  setDiscordClientSecret: (val: string) => void;
  saveDiscordConfigToServer: (id: string, clientId: string, clientSecret: string) => Promise<void>;
  saveStatus: string;
  onClose: () => void;
}

export default function AdminTab({
  adminUsername,
  setAdminUsername,
  adminPassword,
  setAdminPassword,
  isAdminAuthenticated,
  setIsAdminAuthenticated,
  authError,
  setAuthError,
  tempDiscordId,
  setTempDiscordId,
  tempDiscordClientId,
  setTempDiscordClientId,
  tempDiscordClientSecret,
  setTempDiscordClientSecret,
  setDiscordId,
  setDiscordClientId,
  setDiscordClientSecret,
  saveDiscordConfigToServer,
  saveStatus,
  onClose,
}: AdminTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError("");
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
          setIsSubmitting(false);
          return;
        }
      }

      setAuthError("Unauthorized Administrative access token or passcode mismatch");
    } catch (err) {
      console.error("Authentication exception:", err);
      setAuthError("An error occurred during authentication. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel w-full p-6 md:p-8 rounded-2xl flex flex-col gap-6 relative shadow-[0_25px_60px_rgba(34,211,238,0.12)] border-cyan-500/25">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400 rotate-90" />
          <h2 className="text-xs font-bold font-mono tracking-widest uppercase text-stone-200">
            Admin Portal
          </h2>
        </div>
        <button
          onClick={onClose}
          className="group pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-cyan-500/30 hover:text-cyan-200 text-[10px] text-stone-300 tracking-wider uppercase transition-all duration-200 cursor-pointer font-mono"
        >
          <ChevronLeft className="w-3 h-3 text-stone-400 group-hover:text-cyan-400" />
          <span>Back to site</span>
        </button>
      </div>

      {!isAdminAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" noValidate>
          <div className="space-y-1 text-left">
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

          <div className="space-y-1 text-left">
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
            <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-950/20 text-[10px] text-rose-400 font-mono tracking-wide leading-relaxed animate-pulse text-left">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 mt-2 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 active:scale-[0.98] disabled:opacity-50 text-cyan-300 text-xs font-bold tracking-widest uppercase rounded-lg transition-all cursor-pointer font-mono"
          >
            {isSubmitting ? "Authenticating..." : "Authenticate Access"}
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
              <p className="text-[9.5px] text-stone-400 mt-0.5 font-sans">
                Logged in as: {adminUsername}
              </p>
            </div>
          </div>

          <div className="space-y-4 text-left">
            {/* Section 1: Core Snowflake ID */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold font-mono text-cyan-400 tracking-widest uppercase">
                Discord Integration settings
              </h3>
              <p className="text-[10px] text-stone-400 leading-normal font-sans">
                Configure the Discord User Snowflake ID for API presence routing. This ID links the public status widget live with your Discord activity.
              </p>

              {/* Informational card explaining Snowflake ID and Offline troubleshooting */}
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-2.5 text-left">
                <div>
                  <p className="text-[10px] font-bold text-cyan-400 font-mono tracking-wider uppercase mb-0.5">
                    💡 What is a Snowflake ID?
                  </p>
                  <p className="text-[10px] text-stone-400 font-sans leading-relaxed">
                    A **Snowflake ID** is your account's permanent, unique Discord identification number (e.g. <code className="text-stone-200 font-mono bg-white/5 px-1 rounded">1025531959736860714</code>). It is safe, public, and allows our live status feed to fetch your status securely.
                  </p>
                  <p className="text-[10px] text-stone-400 font-sans leading-relaxed mt-1">
                    <strong className="text-stone-300">How to get your Snowflake ID:</strong> Enable **Developer Mode** in Discord Settings -&gt; Advanced, then right-click your profile picture and select **Copy User ID**. Paste it below and click save.
                  </p>
                </div>

                <div className="border-t border-white/5 pt-2">
                  <p className="text-[10px] font-bold text-amber-400 font-mono tracking-wider uppercase mb-0.5">
                    ⚠️ Troubleshooting Discord & Spotify Status
                  </p>
                  <p className="text-[10px] text-stone-400 font-sans leading-relaxed">
                    If the status shows offline or you see errors, review the following:
                  </p>
                  <ul className="list-disc pl-4 text-[10px] text-stone-400 font-sans space-y-1 mt-1 leading-relaxed">
                    <li>
                      <strong className="text-stone-300">Register on Lanyard (Important):</strong> Lanyard tracks presence by sharing a server with you. You must join the Lanyard Discord Server (at <a href="https://discord.gg/7B7u2uX" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">discord.gg/7B7u2uX</a>) to prevent 404 response.
                    </li>
                    <li>Ensure your Discord activity sharing is enabled.</li>
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
                    onChange={(e) => setTempDiscordId(e.target.value.replace(/\D/g, ""))}
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
                    onChange={(e) => setTempDiscordClientId(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter Discord Client ID"
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
                    onChange={(e) => setTempDiscordClientSecret(e.target.value)}
                    placeholder="Enter Discord Client Secret"
                    className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (tempDiscordId) {
                      setDiscordId(tempDiscordId);
                      localStorage.setItem("discord_id", tempDiscordId);
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

          <div className="pt-4 border-t border-white/5 flex items-center justify-between font-mono">
            <p className="text-[9.5px] text-stone-500 uppercase tracking-wider">
              Session Key: REST API
            </p>
            <button
              onClick={() => {
                setIsAdminAuthenticated(false);
                setAdminPassword("");
                setAuthError("");
              }}
              className="text-[10px] text-stone-400 font-bold tracking-widest uppercase hover:text-rose-400 border border-white/5 bg-white/[0.01] hover:bg-rose-500/10 hover:border-rose-500/20 px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer font-mono"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
