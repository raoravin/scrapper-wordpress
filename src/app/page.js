"use client";

import { useState } from "react";
import { Search, Loader2, BookOpen, ExternalLink } from "lucide-react";

export default function UnlockPage() {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hide, setHide] = useState(false); // ✅ New state

  const handleFetch = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    if (!url.startsWith("http")) {
      setError("Please enter a valid URL (starting with http:// or https://)");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/fetch-blog?url=${encodeURIComponent(url)}&hide=${hide}`);
      if (!res.ok) throw new Error("Failed to fetch content");
      const data = await res.json();
      setContent(data.content);
    } catch (error) {
      console.error("Fetch failed:", error);
      setError("Error fetching blog content. Please check the URL and try again.");
      setContent("");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleFetch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 :from-gray-900 :to-gray-800 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 :text-white mb-2 flex items-center justify-center">
            <BookOpen className="mr-2 text-blue-600 :text-blue-400" />
            Unlock Blog Content
          </h1>
          <p className="text-gray-600 :text-gray-300 max-w-2xl mx-auto">
            Remove paywalls and access reader-friendly versions of your favorite blog articles
          </p>
        </div>

        <div className="bg-white :bg-gray-800 rounded-xl shadow p-6 mb-8">
          <div className="relative mb-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste blog post URL here..."
              className="w-full px-4 py-3 pl-10 pr-24 rounded-lg border border-gray-300 :border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all :bg-gray-700 :text-white"
            />
            <Search className="absolute left-3 top-3.5 text-gray-400 :text-gray-500" size={18} />

            <button
              onClick={handleFetch}
              disabled={loading}
              className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 focus:outline-none text-white font-medium rounded-lg px-4 py-1.5 transition-all  disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-1" size={16} />
                  <span>Processing...</span>
                </>
              ) : (
                "Unlock"
              )}
            </button>
          </div>

          {/* ✅ Toggle */}
          <div className="flex items-center space-x-2">
            <label htmlFor="hideToggle" className="text-sm font-medium text-gray-700 :text-gray-300">
              Hide extra content
            </label>
            <input
              id="hideToggle"
              type="checkbox"
              checked={hide}
              onChange={(e) => setHide(e.target.checked)}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-xs text-gray-500 :text-gray-400">{hide ? "true" : "false"}</span>
          </div>

          {error && <div className="mt-3 text-red-500 text-sm">{error}</div>}
        </div>

        {content && (
          <div className="bg-white :bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all">
            <div className="border-b border-gray-200 :border-gray-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 :text-white flex items-center">
                <BookOpen className="mr-2" size={18} />
                Reader View
              </h2>

              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 :text-blue-400 :hover:text-blue-300 text-sm flex items-center"
                >
                  Original Source
                  <ExternalLink size={14} className="ml-1" />
                </a>
              )}
            </div>

            <div className="p-6">
              <div
                className="prose prose-lg :prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        )}

        {!content && !loading && (
          <div className="bg-white/60 :bg-gray-800/60 rounded-xl border-2 border-dashed border-gray-300 :border-gray-700 p-10 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 :text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 :text-gray-300 mb-2">
              No Content Yet
            </h3>
            <p className="text-gray-500 :text-gray-400">
              Enter a blog post URL above and click &quot;Unlock&quot; to view
              the content in a clean, reader-friendly format.
            </p>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500 :text-gray-400">
          <p>
            This tool is for educational purposes only. Respect content creators
            and copyright laws.
          </p>
        </div>
      </div>
    </div>
  );
}
