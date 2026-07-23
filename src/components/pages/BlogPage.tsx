import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Calendar, ArrowLeft, BookOpen, Clock, FileText } from "lucide-react";
import DOMPurify from "dompurify";
import { BlogPost } from "../../types";

interface BlogPageProps {
  activeTab: "blog" | "blog-post";
  activeSlug: string;
  setActiveTab: (tab: "home" | "about" | "admin" | "blog" | "blog-post", slug?: string) => void;
}

export default function BlogPage({ activeTab, activeSlug, setActiveTab }: BlogPageProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all published posts for the feed
  useEffect(() => {
    if (activeTab === "blog") {
      setLoading(true);
      setError("");
      fetch("/api/posts")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch blog posts");
          return res.json();
        })
        .then((data) => {
          setPosts(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("Failed to load the blog feed. Please try again.");
          setLoading(false);
        });
    }
  }, [activeTab]);

  // Fetch a single post when viewing a direct post
  useEffect(() => {
    if (activeTab === "blog-post" && activeSlug) {
      setLoading(true);
      setError("");
      setCurrentPost(null);
      fetch(`/api/posts/${activeSlug}`)
        .then((res) => {
          if (!res.ok) throw new Error("Blog post not found");
          return res.json();
        })
        .then((data) => {
          setCurrentPost(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("We couldn't find that blog post. It may have been deleted or unpublished.");
          setLoading(false);
        });
    }
  }, [activeTab, activeSlug]);

  const handleGoBack = () => {
    if (activeTab === "blog-post") {
      setActiveTab("blog");
    } else {
      setActiveTab("home");
    }
  };

  // Helper to format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper to calculate approximate reading time
  const getReadingTime = (text: string) => {
    const wordsPerMinute = 220;
    const textLength = text.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const minutes = Math.ceil(textLength / wordsPerMinute);
    return `${minutes} min read`;
  };

  return (
    <>
      {/* Self-contained custom styles to render beautiful rich-text elements inside the blog post content */}
      <style>{`
        .blog-rich-content p {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 0.925rem;
          line-height: 1.7;
          color: #d1d5db; /* gray-300 */
          margin-bottom: 1.25rem;
        }
        .blog-rich-content p:last-child {
          margin-bottom: 0;
        }
        .blog-rich-content h1,
        .blog-rich-content h2,
        .blog-rich-content h3,
        .blog-rich-content h4 {
          font-family: system-ui, -apple-system, sans-serif;
          font-weight: 700;
          color: #ffffff;
          margin-top: 1.85rem;
          margin-bottom: 0.75rem;
          line-height: 1.35;
          letter-spacing: -0.02em;
        }
        .blog-rich-content h1 { font-size: 1.5rem; }
        .blog-rich-content h2 { font-size: 1.25rem; border-b: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 0.35rem; }
        .blog-rich-content h3 { font-size: 1.1rem; }

        .blog-rich-content ul,
        .blog-rich-content ol {
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
          color: #d1d5db;
          font-size: 0.925rem;
          line-height: 1.6;
        }
        .blog-rich-content ul {
          list-style-type: disc;
        }
        .blog-rich-content ol {
          list-style-type: decimal;
        }
        .blog-rich-content li {
          margin-bottom: 0.5rem;
        }
        .blog-rich-content li::marker {
          color: #22d3ee; /* cyan-400 */
        }

        .blog-rich-content blockquote {
          border-left: 3px solid #22d3ee; /* cyan-400 */
          padding-left: 1.25rem;
          margin: 1.5rem 0;
          color: #9ca3af; /* gray-400 */
          font-style: italic;
          background: rgba(255, 255, 255, 0.01);
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0 4px 4px 0;
        }

        .blog-rich-content code {
          background: rgba(255, 255, 255, 0.07);
          color: #22d3ee;
          padding: 0.15rem 0.35rem;
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.85em;
        }

        .blog-rich-content pre {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.15rem;
          border-radius: 8px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.825rem;
          line-height: 1.5;
          overflow-x: auto;
          margin: 1.5rem 0;
          color: #e5e7eb;
        }
        .blog-rich-content pre code {
          background: transparent;
          color: inherit;
          padding: 0;
          border-radius: 0;
          font-size: inherit;
        }

        .blog-rich-content a {
          color: #22d3ee;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.15s;
        }
        .blog-rich-content a:hover {
          color: #67e8f9; /* cyan-300 */
        }
      `}</style>

      <div className="glass-panel w-full max-w-[620px] p-6 md:p-8 rounded-2xl flex flex-col gap-6 relative shadow-[0_25px_60px_rgba(34,211,238,0.12)] border-cyan-500/25">

        {/* Header navigation bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h2 className="text-xs font-bold font-mono tracking-widest uppercase text-stone-200">
              Personal Blog
            </h2>
          </div>
          <button
            onClick={handleGoBack}
            className="group pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-cyan-500/30 hover:text-cyan-200 text-[10px] text-stone-300 tracking-wider uppercase transition-all duration-200 cursor-pointer font-mono"
          >
            <ArrowLeft className="w-3 h-3 text-stone-400 group-hover:text-cyan-400" />
            <span>{activeTab === "blog-post" ? "Back to blog" : "Back to site"}</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
            </span>
            <p className="font-mono text-xs text-stone-400 uppercase tracking-widest">
              Syncing publications...
            </p>
          </div>
        ) : error ? (
          /* Error Fallback */
          <div className="py-16 text-center space-y-4">
            <p className="text-sm text-rose-400 font-mono">{error}</p>
            <button
              onClick={handleGoBack}
              className="px-4 py-2 bg-white/5 border border-white/10 text-xs font-mono uppercase rounded-lg hover:bg-white/10 text-stone-200 transition-all cursor-pointer"
            >
              Back to site
            </button>
          </div>
        ) : activeTab === "blog-post" && currentPost ? (
          /* Single Blog Post View */
          <article className="space-y-6 text-left">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(currentPost.createdAt)}</span>
                <span>•</span>
                <Clock className="w-3 h-3" />
                <span>{getReadingTime(currentPost.content)}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white font-sans tracking-tight leading-snug">
                {currentPost.title}
              </h1>
            </div>

            {/* Cover Image */}
            {currentPost.coverImageUrl && (
              <div className="w-full h-44 md:h-56 rounded-xl overflow-hidden border border-white/10 relative">
                <img
                  src={currentPost.coverImageUrl}
                  alt={currentPost.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget.parentNode as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Sanitized HTML Content */}
            <div
              className="blog-rich-content text-stone-300 font-sans pt-4 border-t border-white/5"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(currentPost.content),
              }}
            />
          </article>
        ) : posts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 space-y-3">
            <FileText className="w-8 h-8 text-stone-600 mx-auto" />
            <p className="text-xs font-mono text-stone-500 uppercase tracking-widest">
              No publications yet
            </p>
            <p className="text-[10px] text-stone-400 font-sans max-w-xs mx-auto">
              Check back soon! Or authenticate via the Admin panel and compose your first post.
            </p>
          </div>
        ) : (
          /* Continuous Modern Full Blog Feed */
          <div className="space-y-12">
            {posts.map((post, idx) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.1 }}
                className="text-left space-y-5"
              >
                {/* Meta details & title */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(post.createdAt)}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{getReadingTime(post.content)}</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white hover:text-cyan-300 transition-colors font-sans tracking-tight leading-snug">
                    {post.title}
                  </h3>
                </div>

                {/* Cover Image */}
                {post.coverImageUrl && (
                  <div className="w-full h-40 md:h-48 rounded-xl overflow-hidden border border-white/10 relative">
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.015]"
                      onError={(e) => {
                        (e.currentTarget.parentNode as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Render Full Post Content directly */}
                <div
                  className="blog-rich-content text-stone-300 font-sans pt-3"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(post.content),
                  }}
                />

                {/* Separation bar (if not the last post) */}
                {idx < posts.length - 1 && (
                  <div className="pt-10 border-b border-white/10" />
                )}
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
