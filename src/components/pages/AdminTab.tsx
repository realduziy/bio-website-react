import { useState, useEffect } from "react";
import { Terminal, ChevronLeft, Shield, Eye, HelpCircle, Gamepad2, Play, Plus, Edit, Trash2, FileText, Check, AlertTriangle, ArrowLeft } from "lucide-react";
import { BlogPost } from "../../types";


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
  tempLastfmUsername?: string;
  setTempLastfmUsername?: (val: string) => void;
  setDiscordId: (val: string) => void;
  setDiscordClientId: (val: string) => void;
  setDiscordClientSecret: (val: string) => void;
  setLastfmUsername?: (val: string) => void;
  saveDiscordConfigToServer: (id: string, clientId: string, clientSecret: string, lastfmUser?: string) => Promise<void>;
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
  tempLastfmUsername = "",
  setTempLastfmUsername,
  setDiscordId,
  setDiscordClientId,
  setDiscordClientSecret,
  setLastfmUsername,
  saveDiscordConfigToServer,
  saveStatus,
  onClose,
}: AdminTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState<"discord" | "blog">("discord");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Form states
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postSummary, setPostSummary] = useState("");
  const [postCoverImageUrl, setPostCoverImageUrl] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postIsPublished, setPostIsPublished] = useState(false);
  const [postStatus, setPostStatus] = useState("");

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/posts?all=true&username=${encodeURIComponent(adminUsername)}&password=${encodeURIComponent(adminPassword)}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated && activeSubTab === "blog") {
      fetchPosts();
    }
  }, [isAdminAuthenticated, activeSubTab]);

  const handleCreateNewClick = () => {
    setEditingPost(null);
    setIsCreating(true);
    setPostTitle("");
    setPostSummary("");
    setPostCoverImageUrl("");
    setPostContent("");
    setPostIsPublished(false);
    setPostStatus("");
  };

  const handleEditClick = (post: BlogPost) => {
    setEditingPost(post);
    setIsCreating(false);
    setPostTitle(post.title);
    setPostSummary(post.summary);
    setPostCoverImageUrl(post.coverImageUrl || "");
    setPostContent(post.content);
    setPostIsPublished(post.isPublished);
    setPostStatus("");
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingPost(null);
    setPostStatus("");
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostStatus("Saving...");
    try {
      const body = {
        username: adminUsername,
        password: adminPassword,
        title: postTitle,
        summary: postSummary,
        coverImageUrl: postCoverImageUrl,
        content: postContent,
        isPublished: postIsPublished
      };

      const url = isCreating ? "/api/posts" : `/api/posts/${editingPost?.id}`;
      const method = isCreating ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setPostStatus("Saved successfully!");
        setIsCreating(false);
        setEditingPost(null);
        await fetchPosts();
      } else {
        const errData = await res.json();
        setPostStatus(`Error: ${errData.error || "Failed to save post"}`);
      }
    } catch (err) {
      console.error("Error saving post:", err);
      setPostStatus("Error: Network connection failed.");
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post? This cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUsername,
          password: adminPassword
        })
      });

      if (res.ok) {
        await fetchPosts();
      } else {
        alert("Failed to delete post");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };


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
          {/* Admin Header session info */}
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

          {/* Sub-tabs for switching configurations */}
          <div className="flex border-b border-white/5 gap-4">
            <button
              onClick={() => setActiveSubTab("discord")}
              className={`pb-2 text-xs font-mono tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeSubTab === "discord"
                  ? "border-cyan-400 text-cyan-400 font-bold"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              Discord Config
            </button>
            <button
              onClick={() => setActiveSubTab("blog")}
              className={`pb-2 text-xs font-mono tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeSubTab === "blog"
                  ? "border-cyan-400 text-cyan-400 font-bold"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              Blog Manager
            </button>
          </div>

          <div className="space-y-4 text-left">
            {activeSubTab === "discord" ? (
              /* Section 1: Core Snowflake ID */
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

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-stone-400 block uppercase">
                      Last.fm Username (Optional - Recommended for 24/7 offline tracking)
                    </label>
                    <input
                      type="text"
                      value={tempLastfmUsername}
                      onChange={(e) => setTempLastfmUsername && setTempLastfmUsername(e.target.value.trim())}
                      placeholder="Enter Last.fm Username"
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
                      if (setLastfmUsername) setLastfmUsername(tempLastfmUsername);
                      saveDiscordConfigToServer(
                        tempDiscordId,
                        tempDiscordClientId,
                        tempDiscordClientSecret,
                        tempLastfmUsername
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
            ) : (
              /* Blog Manager Section */
              <div className="space-y-4">
                {isCreating || editingPost ? (
                  /* Blog Form */
                  <form onSubmit={handleSavePost} className="space-y-3.5 text-left">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="text-xs font-bold font-mono text-cyan-400 tracking-widest uppercase">
                        {isCreating ? "Create New Blog Post" : "Edit Blog Post"}
                      </h3>
                      <button
                        type="button"
                        onClick={handleCancelForm}
                        className="inline-flex items-center gap-1 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-stone-300 text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold font-mono tracking-wider text-stone-400 block uppercase">
                        Post Title (Required)
                      </label>
                      <input
                        type="text"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        placeholder="e.g. Minecraft Server Optimization Guide"
                        required
                        className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white font-sans focus:outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold font-mono tracking-wider text-stone-400 block uppercase">
                        Cover Image URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={postCoverImageUrl}
                        onChange={(e) => setPostCoverImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... or /assets/..."
                        className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold font-mono tracking-wider text-stone-400 block uppercase">
                        Post Content (HTML, Required)
                      </label>
                      <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="<p>Write your detailed blog post content using HTML tags...</p>"
                        required
                        rows={8}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 focus:border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white font-sans focus:outline-none transition-all resize-y h-40"
                      />
                    </div>

                    <div className="flex items-center gap-2 py-1 select-none text-left">
                      <input
                        type="checkbox"
                        id="postIsPublished"
                        checked={postIsPublished}
                        onChange={(e) => setPostIsPublished(e.target.checked)}
                        className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
                      />
                      <label htmlFor="postIsPublished" className="text-[10px] font-bold font-mono tracking-wider text-stone-300 uppercase cursor-pointer">
                        Publish Immediately
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-cyan-500/15 border border-cyan-500/40 hover:bg-cyan-500/25 text-cyan-300 rounded-lg py-2.5 text-xs uppercase font-mono tracking-widest font-black transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      Save Post
                    </button>

                    {postStatus && (
                      <p className="text-[10px] text-cyan-400 font-mono mt-1 text-left animate-pulse">
                        ✨ {postStatus}
                      </p>
                    )}
                  </form>
                ) : (
                  /* Post List View */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold font-mono text-cyan-400 tracking-widest uppercase">
                        Blog Posts
                      </h3>
                      <button
                        type="button"
                        onClick={handleCreateNewClick}
                        className="inline-flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Post</span>
                      </button>
                    </div>

                    {loadingPosts ? (
                      <p className="text-[10px] text-stone-500 font-mono text-center py-4 animate-pulse">
                        Loading posts...
                      </p>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-white/10 rounded-lg bg-white/[0.01]">
                        <FileText className="w-6 h-6 text-stone-600 mx-auto mb-2" />
                        <p className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">
                          No blog posts found.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {posts.map((post) => (
                          <div
                            key={post.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all"
                          >
                            <div className="min-w-0 flex-1 pr-3 text-left">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs font-bold text-stone-200 truncate font-sans">
                                  {post.title}
                                </p>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider ${
                                    post.isPublished
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                                      : "bg-stone-500/15 text-stone-400 border border-white/5"
                                  }`}
                                >
                                  {post.isPublished ? "Published" : "Draft"}
                                </span>
                              </div>
                              <p className="text-[8.5px] text-stone-500 font-mono mt-1">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditClick(post)}
                                className="p-1.5 rounded-md border border-white/5 bg-white/[0.02] hover:bg-cyan-500/10 hover:border-cyan-500/25 text-stone-400 hover:text-cyan-300 transition-all cursor-pointer"
                                title="Edit Post"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post.id)}
                                className="p-1.5 rounded-md border border-white/5 bg-white/[0.02] hover:bg-rose-500/10 hover:border-rose-500/25 text-stone-400 hover:text-rose-400 transition-all cursor-pointer"
                                title="Delete Post"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
