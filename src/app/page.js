"use client";

import { useState, useRef } from "react";

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function LiveLawReader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [article, setArticle] = useState(null);
  const [copied, setCopied] = useState(false);
  const articleRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    setStatus({ msg: "Connecting to LiveLaw… fetching AMP & full page…", type: "loading" });
    setArticle(null);

    try {
      const resp = await fetch("/api/fetch-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await resp.json();

      if (!data.success) {
        setStatus({ msg: data.error || "Failed to fetch article", type: "error" });
        return;
      }

      setArticle(data);
      setStatus({ msg: "", type: "" });
      setTimeout(() => articleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch {
      setStatus({ msg: "Network error. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function copyContent() {
    if (!article?.content) return;
    try {
      await navigator.clipboard.writeText(article.content);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = article.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const pdfHref = article?.pdf_link
    ? article.pdf_link.startsWith("http")
      ? article.pdf_link
      : "https://www.livelaw.in" + article.pdf_link
    : null;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg-primary: #0a0a0f;
          --bg-secondary: #12121a;
          --bg-card: #1a1a28;
          --bg-card-hover: #222236;
          --bg-input: #16162266;
          --border: #2a2a40;
          --border-focus: #6c5ce7;
          --text-primary: #e8e8f0;
          --text-secondary: #9090a8;
          --text-muted: #606078;
          --accent: #6c5ce7;
          --accent-soft: #6c5ce720;
          --accent-glow: #6c5ce740;
          --accent-secondary: #a29bfe;
          --gradient-1: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
          --shadow-md: 0 8px 32px rgba(0,0,0,0.4);
          --shadow-glow: 0 0 40px #6c5ce740;
          --radius-sm: 8px;
          --radius-md: 12px;
          --radius-lg: 16px;
          --radius-xl: 24px;
        }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg-primary);
          color: var(--text-primary);
          line-height: 1.6;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 600px 400px at 20% 10%, #6c5ce710 0%, transparent 70%),
            radial-gradient(ellipse 400px 300px at 80% 60%, #a29bfe08 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .wrap { max-width: 900px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }

        /* Header */
        .hdr { padding: 48px 0 16px; text-align: center; }
        .hdr-logo { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .hdr-icon {
          width: 48px; height: 48px; background: var(--gradient-1);
          border-radius: var(--radius-md); display: flex; align-items: center;
          justify-content: center; font-size: 24px; box-shadow: var(--shadow-glow);
        }
        .hdr-title {
          font-family: 'Georgia', serif; font-size: 32px; font-weight: 700;
          background: var(--gradient-1); -webkit-background-clip: text;
          -webkit-text-fill-color: transparent; background-clip: text;
        }
        .hdr-sub { color: var(--text-secondary); font-size: 15px; max-width: 500px; margin: 0 auto; }

        /* Search */
        .search-sec { padding: 24px 0 40px; }
        .search-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-xl); padding: 32px; box-shadow: var(--shadow-md);
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .search-card:focus-within { border-color: var(--border-focus); box-shadow: var(--shadow-md), var(--shadow-glow); }
        .search-form { display: flex; gap: 12px; align-items: stretch; }
        .input-wrap { flex: 1; position: relative; }
        .search-input {
          width: 100%; padding: 16px 16px 16px 16px;
          background: var(--bg-input); border: 1px solid var(--border);
          border-radius: var(--radius-lg); color: var(--text-primary);
          font-size: 14px; outline: none; transition: all 0.3s;
        }
        .search-input::placeholder { color: var(--text-muted); }
        .search-input:focus { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent-soft); }
        .fetch-btn {
          padding: 16px 32px; background: var(--gradient-1); border: none;
          border-radius: var(--radius-lg); color: white; font-size: 15px;
          font-weight: 600; cursor: pointer; transition: all 0.3s; white-space: nowrap;
          display: flex; align-items: center; gap: 8px;
        }
        .fetch-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--shadow-glow); }
        .fetch-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .spinner {
          width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .status-bar {
          margin-top: 16px; display: flex; align-items: center; gap: 8px;
          padding: 12px 16px; border-radius: var(--radius-md);
          font-size: 13px; font-weight: 500; animation: slideDown 0.3s ease;
        }
        .status-loading { background: var(--accent-soft); border: 1px solid var(--accent-glow); color: var(--accent-secondary); }
        .status-error { background: #e74c3c15; border: 1px solid #e74c3c30; color: #ff6b6b; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

        /* Article */
        .article-wrap { padding-bottom: 80px; animation: fadeUp 0.5s ease; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .article-header {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-xl); overflow: hidden;
          margin-bottom: 24px; box-shadow: var(--shadow-md);
        }
        .hero-img { width: 100%; height: 280px; object-fit: cover; display: block; }
        .article-header-content { padding: 32px; }
        .article-badge {
          display: inline-block; padding: 4px 14px; background: var(--accent-soft);
          color: var(--accent-secondary); font-size: 12px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.8px; border-radius: 100px; margin-bottom: 16px;
        }
        .article-title {
          font-family: 'Georgia', serif; font-size: 28px; font-weight: 700;
          line-height: 1.3; margin-bottom: 12px; color: var(--text-primary);
        }
        .article-desc { font-size: 16px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px; }
        .article-meta {
          display: flex; flex-wrap: wrap; gap: 20px;
          padding-top: 20px; border-top: 1px solid var(--border);
        }
        .meta-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); }
        .meta-val { color: var(--text-secondary); font-weight: 500; }

        /* Actions */
        .action-bar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
        .action-btn {
          display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-md); color: var(--text-secondary);
          font-size: 13px; font-weight: 500; text-decoration: none;
          cursor: pointer; transition: all 0.2s;
        }
        .action-btn:hover { border-color: var(--accent); color: var(--accent-secondary); background: var(--bg-card-hover); }
        .action-btn.primary { background: var(--gradient-1); border-color: transparent; color: white; }
        .action-btn.primary:hover { box-shadow: var(--shadow-glow); transform: translateY(-1px); }

        /* Body */
        .article-body {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-xl); padding: 40px;
          box-shadow: var(--shadow-md); margin-bottom: 24px;
        }
        .body-label {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 1.2px; color: var(--text-muted);
          margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
        }
        .article-content { font-size: 17px; line-height: 1.85; color: var(--text-primary); }
        .article-content p { margin-bottom: 20px; color: var(--text-primary); }
        .article-content h1,.article-content h2,.article-content h3,
        .article-content h4,.article-content h5,.article-content h6 {
          font-family: 'Georgia', serif; margin: 32px 0 16px; line-height: 1.3; color: var(--text-primary);
        }
        .article-content h2 { font-size: 24px; }
        .article-content h3 { font-size: 20px; }
        .article-content a { color: var(--accent-secondary); text-decoration: underline; text-underline-offset: 3px; }
        .article-content a:hover { color: var(--accent); }
        .article-content blockquote {
          border-left: 3px solid var(--accent); padding: 16px 20px; margin: 24px 0;
          background: var(--accent-soft); border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
          font-style: italic; color: var(--text-secondary);
        }
        .article-content ul, .article-content ol { padding-left: 24px; margin-bottom: 20px; }
        .article-content li { margin-bottom: 8px; color: var(--text-primary); }
        .article-content strong, .article-content b { color: var(--text-primary); font-weight: 600; }
        .article-content img { max-width: 100%; border-radius: var(--radius-md); margin: 16px 0; }
        .plain-text { white-space: pre-wrap; font-size: 17px; line-height: 1.85; color: var(--text-primary); }

        /* Citations */
        .citations-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-xl); padding: 28px 32px; box-shadow: var(--shadow-md);
        }
        .citations-title {
          font-size: 14px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.8px; color: var(--text-muted); margin-bottom: 16px;
        }
        .citation-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 0; border-bottom: 1px solid var(--border);
          font-family: monospace; font-size: 13px; color: var(--accent-secondary);
        }
        .citation-item:last-child { border-bottom: none; }
        .citation-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; flex-shrink: 0; }

        /* Footer */
        .footer { text-align: center; padding: 40px 0; color: var(--text-muted); font-size: 13px; }

        @media (max-width: 640px) {
          .hdr { padding: 32px 0 8px; }
          .hdr-title { font-size: 24px; }
          .search-card { padding: 20px; }
          .search-form { flex-direction: column; }
          .article-header-content { padding: 20px; }
          .article-title { font-size: 22px; }
          .article-body { padding: 24px; }
          .article-content { font-size: 15px; }
        }
        @media print {
          body { background: white; color: black; }
          body::before { display: none; }
          .hdr, .search-sec, .action-bar, .footer { display: none; }
          .article-header, .article-body, .citations-card { background: white; border: 1px solid #ddd; box-shadow: none; }
          .article-content, .article-title { color: black; }
        }
      `}</style>

      {/* Header */}
      <header className="hdr">
        <div className="wrap">
          <div className="hdr-logo">
            <div className="hdr-icon">⚖️</div>
            <h1 className="hdr-title">LiveLaw Reader</h1>
          </div>
          <p className="hdr-sub">Paste any LiveLaw URL below to read the full premium article content</p>
        </div>
      </header>

      {/* Search */}
      <section className="search-sec">
        <div className="wrap">
          <div className="search-card">
            <form className="search-form" onSubmit={handleSubmit}>
              <div className="input-wrap">
                <input
                  type="text"
                  className="search-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste LiveLaw article URL here..."
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                />
              </div>
              <button type="submit" className="fetch-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    Fetching…
                  </>
                ) : (
                  "Fetch Article"
                )}
              </button>
            </form>

            {status.msg && (
              <div className={`status-bar ${status.type === "error" ? "status-error" : "status-loading"}`}>
                {status.msg}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Article */}
      {article && (
        <section className="article-wrap" ref={articleRef}>
          <div className="wrap">

            {/* Header card */}
            <div className="article-header">
              {article.image_url && (
                <img className="hero-img" src={article.image_url} alt={article.title || ""} />
              )}
              <div className="article-header-content">
                <span className="article-badge">{article.section || "Article"}</span>
                <h2 className="article-title">{article.headline || article.title || "Untitled"}</h2>
                {article.description && <p className="article-desc">{article.description}</p>}
                <div className="article-meta">
                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span className="meta-val">{article.author || "Unknown"}</span>
                  </div>
                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span className="meta-val">{formatDate(article.published_date)}</span>
                  </div>
                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span className="meta-val">{(article.content_length || 0).toLocaleString()} chars</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div className="action-bar">
              <a className="action-btn" href={article.url} target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Original
              </a>
              {pdfHref && (
                <a className="action-btn" href={pdfHref} target="_blank" rel="noopener noreferrer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Download PDF
                </a>
              )}
              <button className="action-btn" onClick={copyContent}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                {copied ? "Copied!" : "Copy Text"}
              </button>
              <button className="action-btn" onClick={() => window.print()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Print
              </button>
            </div>

            {/* Article body */}
            <div className="article-body">
              <div className="body-label">Full Article Content</div>
              {article.content_html && article.content_html.length > 100 ? (
                <div
                  className="article-content"
                  dangerouslySetInnerHTML={{ __html: article.content_html }}
                />
              ) : article.content ? (
                <div className="plain-text">{article.content}</div>
              ) : (
                <p style={{ color: "var(--text-muted)" }}>No content could be extracted from this article.</p>
              )}
            </div>

            {/* Citations */}
            {article.cited_cases?.length > 0 && (
              <div className="citations-card">
                <div className="citations-title">Cited Cases</div>
                {article.cited_cases.map((c, i) => (
                  <div key={i} className="citation-item">
                    <span className="citation-dot" />
                    {c}
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>
      )}

      <footer className="footer">
        <div className="wrap">
          Content fetched via Googlebot-compatible indexing. For educational &amp; research use.
        </div>
      </footer>
    </>
  );
}
