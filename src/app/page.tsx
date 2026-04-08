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
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      const msg =
        err instanceof Error ? err.message : "Something went wrong.";
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

  const videoFormats =
    info?.formats.filter((f) => f.type === "video") || [];
  const audioFormats =
    info?.formats.filter((f) => f.type === "audio") || [];
  const currentFormats = tab === "video" ? videoFormats : audioFormats;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background effects */}
      <div className="hero-gradient" />
      <div className="fixed inset-0 z-[-1] dot-pattern" />

      {/* Header */}
      <header className="w-full px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/20">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Zincad
            </span>
          </div>
          <span className="text-xs font-medium text-slate-400 hidden sm:block">
            Free & fast video downloads
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl">
          {/* State 1: Empty */}
          {state === "empty" && (
            <div className="pt-16 sm:pt-24 fade-in-up">
              {/* Badge */}
              <div className="fade-in-up">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  50+ supported platforms
                </span>
              </div>

              <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 text-balance leading-[1.1] fade-in-up-delay-1">
                Download any video,{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                  instantly
                </span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl leading-relaxed fade-in-up-delay-2">
                YouTube, TikTok, Instagram, Twitter, Facebook, Reddit, Vimeo
                and more. No signup, no software.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-8 fade-in-up-delay-2"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.02a4.5 4.5 0 00-6.364-6.364L6.257 6.314a4.5 4.5 0 001.242 7.244"
                        />
                      </svg>
                    </div>
                    <input
                      ref={inputRef}
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onPaste={handlePaste}
                      placeholder="Paste a video URL here..."
                      className="w-full h-13 sm:h-14 pl-12 pr-4 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-base focus:outline-none focus:border-blue-300 input-glow transition"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-13 sm:h-14 px-7 rounded-2xl btn-primary text-white font-semibold text-base whitespace-nowrap cursor-pointer"
                  >
                    Paste & fetch
                  </button>
                </div>
              </form>

              <div className="mt-8 fade-in-up-delay-3">
                <PlatformIcons />
              </div>

              {/* How it works */}
              <div className="mt-16 fade-in-up-delay-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="glass-card rounded-2xl p-5 text-center">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.02a4.5 4.5 0 00-6.364-6.364L6.257 6.314a4.5 4.5 0 001.242 7.244" />
                      </svg>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-900">Paste link</h3>
                    <p className="mt-1 text-xs text-slate-500">Copy the video URL from any platform</p>
                  </div>
                  <div className="glass-card rounded-2xl p-5 text-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                      </svg>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-900">Pick quality</h3>
                    <p className="mt-1 text-xs text-slate-500">Choose from 4K, 1080p, 720p, or audio</p>
                  </div>
                  <div className="glass-card rounded-2xl p-5 text-center">
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mx-auto">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-900">Download</h3>
                    <p className="mt-1 text-xs text-slate-500">Direct download, no waiting</p>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <AdBanner slot="TOP_BANNER" format="horizontal" />
              </div>
            </div>
          )}

          {/* State 2: Loading */}
          {state === "loading" && (
            <div className="pt-12 sm:pt-20 fade-in-up">
              <div className="glass-card-elevated rounded-2xl p-5 sm:p-7">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm font-medium text-slate-500 pulse-soft">
                    Fetching video info...
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-52 h-32 rounded-xl skeleton" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-5 w-4/5 skeleton" />
                    <div className="h-4 w-2/5 skeleton" />
                    <div className="h-4 w-3/5 skeleton" />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="h-12 w-full skeleton" />
                  <div className="h-12 w-full skeleton" />
                  <div className="h-14 w-full rounded-xl skeleton" />
                </div>
              </div>
            </div>
          )}

          {/* State 3: Result */}
          {state === "result" && info && (
            <div className="pt-8 sm:pt-12 fade-in-up">
              <div className="glass-card-elevated rounded-2xl p-5 sm:p-7">
                {/* Video preview */}
                <div className="flex flex-col sm:flex-row gap-5">
                  {info.thumbnail && (
                    <div className="w-full sm:w-52 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={info.thumbnail}
                        alt={info.title}
                        className="w-full h-32 object-cover rounded-xl bg-slate-100 shadow-sm"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug line-clamp-2">
                      {info.title}
                    </h2>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {info.platform}
                      </span>
                      {info.duration && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-500 border border-slate-100">
                          {info.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* Format selector */}
                <div>
                  {/* Tabs */}
                  {videoFormats.length > 0 && audioFormats.length > 0 && (
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 mb-4">
                      <button
                        onClick={() => {
                          setTab("video");
                          setSelectedFormat(videoFormats[0] || null);
                        }}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                          tab === "video"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                          </svg>
                          Video
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setTab("audio");
                          setSelectedFormat(audioFormats[0] || null);
                        }}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                          tab === "audio"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                          </svg>
                          Audio only
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Format options */}
                  <div className="space-y-2">
                    {currentFormats.map((f) => (
                      <label
                        key={`${f.itag}-${f.quality}`}
                        className={`format-option flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer ${
                          selectedFormat?.itag === f.itag
                            ? "border-blue-500 bg-blue-50/80 shadow-sm shadow-blue-500/10"
                            : "border-slate-100 hover:border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                              selectedFormat?.itag === f.itag
                                ? "border-blue-500"
                                : "border-slate-300"
                            }`}
                          >
                            {selectedFormat?.itag === f.itag && (
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <input
                            type="radio"
                            name="format"
                            checked={selectedFormat?.itag === f.itag}
                            onChange={() => setSelectedFormat(f)}
                            className="sr-only"
                          />
                          <span className="text-sm font-semibold text-slate-900">
                            {f.type === "video"
                              ? f.quality
                              : f.ext.toUpperCase()}
                          </span>
                          {f.type === "audio" && (
                            <span className="text-xs text-slate-500">
                              {f.quality}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {f.ext}
                          </span>
                          {f.filesize && (
                            <span className="text-xs font-medium text-slate-400 tabular-nums">
                              {formatFileSize(f.filesize)}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}

                    {currentFormats.length === 0 && (
                      <p className="text-sm text-slate-500 py-3 text-center">
                        No {tab} formats available.
                      </p>
                    )}
                  </div>

                  {/* Download button */}
                  <button
                    onClick={handleDownload}
                    disabled={!selectedFormat || downloading}
                    className="mt-5 w-full h-13 sm:h-14 rounded-2xl btn-primary text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2.5 cursor-pointer"
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
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                          />
                        </svg>
                        Download
                      </>
                    )}
                  </button>
                </div>

                {/* Download another */}
                <div className="mt-5 text-center">
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition cursor-pointer group"
                  >
                    <svg className="w-4 h-4 transition group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Download another video
                  </button>
                </div>
              </div>

              {/* Mid-rect ad */}
              <div className="mt-10">
                <AdBanner slot="MID_RECT" format="rectangle" />
              </div>
            </div>
          )}

          {/* State 4: Error */}
          {state === "error" && (
            <div className="pt-12 sm:pt-20 fade-in-up">
              <div className="glass-card-elevated rounded-2xl p-7 sm:p-10 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <svg
                    className="h-7 w-7 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                </div>
                <h2 className="mt-5 text-xl font-bold text-slate-900">
                  Couldn&apos;t fetch that URL
                </h2>
                <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  This can happen if the video is private, DRM-protected,
                  age-restricted, or from an unsupported site.
                </p>
                <button
                  onClick={reset}
                  className="mt-7 h-11 px-7 rounded-2xl btn-primary text-white font-semibold text-sm cursor-pointer"
                >
                  Try another URL
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 sm:px-6 lg:px-8 py-8 mt-16">
        <div className="max-w-3xl mx-auto">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-400">
              Zincad does not host or store any videos. All downloads are sourced
              directly from the original platform.
            </p>
            <p className="text-xs text-slate-300">
              zincad.com
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
