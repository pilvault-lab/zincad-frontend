"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { PlatformIcons } from "@/components/PlatformIcons";
import { AdBanner } from "@/components/AdBanner";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface Format {
  type: "video" | "audio";
  quality: string;
  ext: string;
  filesize: number | null;
  itag: string;
}

interface VideoInfo {
  title: string;
  thumbnail: string | null;
  duration: string | null;
  platform: string;
  formats: Format[];
}

type AppState = "empty" | "loading" | "result" | "error";

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function Home() {
  const [state, setState] = useState<AppState>("empty");
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [tab, setTab] = useState<"video" | "audio">("video");
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
  const [downloading, setDownloading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchInfo = useCallback(async (videoUrl: string) => {
    const trimmed = videoUrl.trim();
    if (!trimmed) return;

    setState("loading");
    try {
      const res = await fetch(`${API}/api/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch video info.");
      }

      const data: VideoInfo = await res.json();

      if (!data.formats || data.formats.length === 0) {
        toast.error("No downloadable formats found for this video.");
        setState("error");
        return;
      }

      setInfo(data);

      const videoFormats = data.formats.filter((f) => f.type === "video");
      const audioFormats = data.formats.filter((f) => f.type === "audio");

      if (videoFormats.length > 0) {
        setTab("video");
        setSelectedFormat(videoFormats[0]);
      } else if (audioFormats.length > 0) {
        setTab("audio");
        setSelectedFormat(audioFormats[0]);
      }

      setState("result");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
      setState("error");
    }
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData("text");
      if (pasted) {
        setUrl(pasted);
        setTimeout(() => fetchInfo(pasted), 0);
      }
    },
    [fetchInfo]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      fetchInfo(url);
    },
    [url, fetchInfo]
  );

  const handleDownload = useCallback(async () => {
    if (!selectedFormat || !url) return;

    setDownloading(true);
    try {
      const res = await fetch(`${API}/api/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          itag: selectedFormat.itag,
          ext: selectedFormat.ext,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get download link.");
      }

      const { directUrl, filename } = await res.json();

      const a = document.createElement("a");
      a.href = directUrl;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Download failed.";
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  }, [selectedFormat, url]);

  const reset = useCallback(() => {
    setState("empty");
    setUrl("");
    setInfo(null);
    setSelectedFormat(null);
    setDownloading(false);
    setTab("video");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const videoFormats = info?.formats.filter((f) => f.type === "video") || [];
  const audioFormats = info?.formats.filter((f) => f.type === "audio") || [];
  const currentFormats = tab === "video" ? videoFormats : audioFormats;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Zincad
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl">
          {/* State 1: Empty */}
          {state === "empty" && (
            <div className="pt-12 sm:pt-20">
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900 text-balance">
                Download any video, instantly
              </h1>
              <p className="mt-3 text-base sm:text-lg text-gray-500">
                YouTube, TikTok, Instagram, Twitter, Facebook, Reddit, Vimeo and
                more
              </p>

              <form onSubmit={handleSubmit} className="mt-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    ref={inputRef}
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Paste a video URL here..."
                    className="flex-1 h-12 sm:h-14 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="h-12 sm:h-14 px-6 rounded-xl bg-blue-600 text-white font-medium text-base hover:bg-blue-700 active:bg-blue-800 transition whitespace-nowrap cursor-pointer"
                  >
                    Paste &amp; fetch
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <PlatformIcons />
              </div>

              <div className="mt-10">
                <AdBanner slot="TOP_BANNER" format="horizontal" />
              </div>
            </div>
          )}

          {/* State 2: Loading */}
          {state === "loading" && (
            <div className="pt-12 sm:pt-20">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-48 h-28 rounded-lg skeleton" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-3/4 rounded skeleton" />
                    <div className="h-4 w-1/3 rounded skeleton" />
                    <div className="h-4 w-1/2 rounded skeleton" />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="h-10 w-full rounded-lg skeleton" />
                  <div className="h-10 w-full rounded-lg skeleton" />
                  <div className="h-12 w-full rounded-xl skeleton" />
                </div>
              </div>
            </div>
          )}

          {/* State 3: Result */}
          {state === "result" && info && (
            <div className="pt-8 sm:pt-12">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
                {/* Video preview */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {info.thumbnail && (
                    <div className="w-full sm:w-48 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={info.thumbnail}
                        alt={info.title}
                        className="w-full h-28 object-cover rounded-lg bg-gray-100"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">
                      {info.title}
                    </h2>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {info.platform}
                      </span>
                      {info.duration && (
                        <span className="text-sm text-gray-500">
                          {info.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Format selector */}
                <div className="mt-6">
                  {/* Tabs */}
                  {videoFormats.length > 0 && audioFormats.length > 0 && (
                    <div className="inline-flex rounded-lg bg-gray-100 p-1 mb-4">
                      <button
                        onClick={() => {
                          setTab("video");
                          setSelectedFormat(videoFormats[0] || null);
                        }}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
                          tab === "video"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Video
                      </button>
                      <button
                        onClick={() => {
                          setTab("audio");
                          setSelectedFormat(audioFormats[0] || null);
                        }}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
                          tab === "audio"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Audio only
                      </button>
                    </div>
                  )}

                  {/* Format options */}
                  <div className="space-y-2">
                    {currentFormats.map((f) => (
                      <label
                        key={`${f.itag}-${f.quality}`}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                          selectedFormat?.itag === f.itag
                            ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="format"
                            checked={selectedFormat?.itag === f.itag}
                            onChange={() => setSelectedFormat(f)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-600"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {f.type === "video" ? f.quality : f.ext.toUpperCase()}
                          </span>
                          {f.type === "audio" && (
                            <span className="text-xs text-gray-500">
                              {f.quality}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 uppercase">
                            {f.ext}
                          </span>
                          {f.filesize && (
                            <span className="text-xs text-gray-500">
                              {formatFileSize(f.filesize)}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}

                    {currentFormats.length === 0 && (
                      <p className="text-sm text-gray-500 py-2">
                        No {tab} formats available.
                      </p>
                    )}
                  </div>

                  {/* Download button */}
                  <button
                    onClick={handleDownload}
                    disabled={!selectedFormat || downloading}
                    className="mt-4 w-full h-12 rounded-xl bg-blue-600 text-white font-medium text-base hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {downloading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Download
                      </>
                    )}
                  </button>
                </div>

                {/* Download another */}
                <div className="mt-4 text-center">
                  <button
                    onClick={reset}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    Download another video
                  </button>
                </div>
              </div>

              {/* Mid-rect ad */}
              <div className="mt-8">
                <AdBanner slot="MID_RECT" format="rectangle" />
              </div>
            </div>
          )}

          {/* State 4: Error */}
          {state === "error" && (
            <div className="pt-12 sm:pt-20">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900">
                  Couldn&apos;t fetch that URL
                </h2>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  This can happen if the video is private, DRM-protected, age-restricted, or from an unsupported site.
                </p>
                <button
                  onClick={reset}
                  className="mt-6 h-10 px-6 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition cursor-pointer"
                >
                  Try another URL
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 sm:px-6 lg:px-8 py-6 mt-12">
        <div className="max-w-3xl mx-auto text-center text-xs text-gray-400">
          Zincad does not host or store any videos. All downloads are sourced directly from the original platform.
        </div>
      </footer>
    </div>
  );
}
