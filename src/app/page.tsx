"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { PlatformIcons } from "@/components/PlatformIcons";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface Format {
  type: "video" | "audio";
  quality: string;
  ext: string;
  filesize: number | null;
  formatStr: string;
}

interface VideoInfo {
  title: string;
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

const QualityBadge = ({ quality }: { quality: string }) => {
  if (quality === "4K") return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 uppercase tracking-wider">4K</span>
  );
  if (quality === "1080p") return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25 uppercase tracking-wider">HD</span>
  );
  if (quality === "720p") return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 uppercase tracking-wider">HD</span>
  );
  return null;
};

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

  const handleDownload = useCallback(() => {
    if (!selectedFormat || !url || !info) return;
    setDownloading(true);

    const params = new URLSearchParams({
      url: url.trim(),
      format: selectedFormat.formatStr,
      ext: selectedFormat.ext,
      filename: info.title || "download",
    });

    const a = document.createElement("a");
    a.href = `${API}/api/download?${params.toString()}`;
    a.download = `${info.title || "download"}.${selectedFormat.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => setDownloading(false), 3000);
  }, [selectedFormat, url, info]);

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
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Background */}
      <div className="bg-mesh" aria-hidden="true">
        <div className="bg-blob-3" />
      </div>
      <div className="dot-grid" aria-hidden="true" />

      {/* Header */}
      <header className="w-full px-4 sm:px-6 lg:px-8 py-5 relative z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 blur-md opacity-40 -z-10" />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-white">Zincad</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Always free
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-3xl">

          {/* ── EMPTY STATE ── */}
          {state === "empty" && (
            <div className="pt-14 sm:pt-20">

              {/* Badge */}
              <div className="anim-fade-up flex justify-center sm:justify-start">
                <div className="badge">
                  <span className="badge-dot" />
                  50+ platforms supported
                </div>
              </div>

              {/* Headline */}
              <h1 className="anim-fade-up-1 mt-6 text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-balance">
                Download any video
                <br />
                <span className="gradient-text">in seconds.</span>
              </h1>

              <p className="anim-fade-up-2 mt-5 text-base sm:text-lg text-slate-400 max-w-lg leading-relaxed">
                YouTube, TikTok, Instagram, Twitter, Facebook & more.
                Paste a link — get your file. No signup, no limits.
              </p>

              {/* URL Input */}
              <form onSubmit={handleSubmit} className="anim-fade-up-2 mt-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative gradient-border">
                    <div className="absolute inset-[-1px] rounded-[17px] bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-blue-500/30 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 pointer-events-none z-0" />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.02a4.5 4.5 0 00-6.364-6.364L6.257 6.314a4.5 4.5 0 001.242 7.244" />
                      </svg>
                    </div>
                    <input
                      ref={inputRef}
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onPaste={handlePaste}
                      placeholder="Paste a video URL here..."
                      className="url-input w-full h-14 pl-12 pr-4 rounded-2xl text-base text-white"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary h-14 px-7 rounded-2xl text-white font-semibold text-base whitespace-nowrap cursor-pointer"
                  >
                    Fetch Video
                  </button>
                </div>
              </form>

              {/* Platform pills */}
              <div className="anim-fade-up-3 mt-6">
                <PlatformIcons />
              </div>

              {/* Stats */}
              <div className="anim-fade-up-3 mt-12 grid grid-cols-3 gap-4">
                {[
                  { value: "50+", label: "Platforms" },
                  { value: "4K", label: "Max Quality" },
                  { value: "Free", label: "Always" },
                ].map((stat) => (
                  <div key={stat.label} className="card rounded-2xl p-5 text-center">
                    <div className="stat-number text-2xl sm:text-3xl font-black gradient-text">{stat.value}</div>
                    <div className="mt-1 text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* How it works */}
              <div className="anim-fade-up-4 mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    step: "01",
                    title: "Paste your link",
                    desc: "Copy any video URL and paste it above — we detect the platform instantly.",
                    icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.02a4.5 4.5 0 00-6.364-6.364L6.257 6.314a4.5 4.5 0 001.242 7.244" />
                      </svg>
                    ),
                    color: "from-indigo-500 to-blue-600",
                    glow: "rgba(99,102,241,0.25)",
                  },
                  {
                    step: "02",
                    title: "Pick your quality",
                    desc: "Choose from 4K, 1080p, 720p, 480p, 360p or extract audio as MP3/M4A.",
                    icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                      </svg>
                    ),
                    color: "from-purple-500 to-indigo-600",
                    glow: "rgba(139,92,246,0.25)",
                  },
                  {
                    step: "03",
                    title: "Download instantly",
                    desc: "Your file streams directly to your device — no waiting, no watermarks.",
                    icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    ),
                    color: "from-blue-500 to-cyan-600",
                    glow: "rgba(59,130,246,0.25)",
                  },
                ].map((item) => (
                  <div key={item.step} className="step-card card rounded-2xl p-5 group transition-all duration-300 hover:border-white/12">
                    <div
                      className={`step-icon w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-4`}
                      style={{ boxShadow: `0 4px 16px ${item.glow}` }}
                    >
                      {item.icon}
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">{item.step}</div>
                    <h3 className="text-sm font-bold text-white mb-1.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LOADING STATE ── */}
          {state === "loading" && (
            <div className="pt-12 sm:pt-16 anim-scale-in">
              <div className="card-elevated rounded-2xl p-6 sm:p-8">
                {/* Loading header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-400 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-400">Fetching video info&hellip;</span>
                </div>
                {/* Skeletons */}
                <div className="space-y-3">
                  <div className="h-5 w-3/4 skeleton" />
                  <div className="h-4 w-1/3 skeleton" />
                </div>
                <div className="divider my-6" />
                <div className="space-y-3">
                  <div className="h-14 w-full skeleton" />
                  <div className="h-14 w-full skeleton" />
                  <div className="h-14 w-full skeleton" />
                  <div className="h-14 w-3/4 skeleton" />
                </div>
                <div className="mt-6 h-14 w-full skeleton rounded-2xl" />
              </div>
            </div>
          )}

          {/* ── RESULT STATE ── */}
          {state === "result" && info && (
            <div className="pt-8 sm:pt-12 anim-scale-in">
              <div className="card-elevated rounded-2xl p-5 sm:p-7">

                {/* Video meta */}
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-2">
                      {info.title}
                    </h2>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/12 text-indigo-400 border border-indigo-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        {info.platform}
                      </span>
                      {info.duration && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 border border-white/08 bg-white/04">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {info.duration}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={reset} title="Start over" className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-400 hover:bg-white/05 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="divider my-5" />

                {/* Format tabs */}
                {videoFormats.length > 0 && audioFormats.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => { setTab("video"); setSelectedFormat(videoFormats[0] || null); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${tab === "video" ? "tab-active" : "tab-inactive"}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                      Video
                    </button>
                    <button
                      onClick={() => { setTab("audio"); setSelectedFormat(audioFormats[0] || null); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${tab === "audio" ? "tab-active" : "tab-inactive"}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                      </svg>
                      Audio only
                    </button>
                  </div>
                )}

                {/* Format list */}
                <div className="space-y-2">
                  {currentFormats.map((f, i) => (
                    <div
                      key={`${f.formatStr}-${i}`}
                      onClick={() => setSelectedFormat(f)}
                      className={`format-option flex items-center justify-between p-4 rounded-xl border ${
                        selectedFormat?.formatStr === f.formatStr ? "selected" : "border-white/07"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Radio dot */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selectedFormat?.formatStr === f.formatStr ? "border-indigo-400 bg-indigo-500/10" : "border-white/20"
                        }`}>
                          {selectedFormat?.formatStr === f.formatStr && (
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{f.quality}</span>
                          <QualityBadge quality={f.quality} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-white/07 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {f.ext}
                        </span>
                        {f.filesize && (
                          <span className="text-xs font-medium text-slate-500 tabular-nums">
                            ~{formatFileSize(f.filesize)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {currentFormats.length === 0 && (
                    <p className="text-sm text-slate-500 py-4 text-center">No {tab} formats available.</p>
                  )}
                </div>

                {/* Download button */}
                <button
                  onClick={handleDownload}
                  disabled={!selectedFormat || downloading}
                  className="btn-primary mt-5 w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-3 cursor-pointer"
                >
                  {downloading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Starting download&hellip;
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download {selectedFormat ? `— ${selectedFormat.quality} ${selectedFormat.ext.toUpperCase()}` : ""}
                    </>
                  )}
                </button>

                {/* Back link */}
                <div className="mt-5 text-center">
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-400 transition cursor-pointer group"
                  >
                    <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Download another video
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ERROR STATE ── */}
          {state === "error" && (
            <div className="pt-12 sm:pt-20 anim-scale-in">
              <div className="card-elevated rounded-2xl p-8 sm:p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
                  <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">Couldn&apos;t fetch that URL</h2>
                <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  The video may be private, DRM-protected, age-restricted, or from an unsupported platform. Try another link.
                </p>
                <button
                  onClick={reset}
                  className="btn-primary mt-8 h-11 px-8 rounded-2xl text-white font-semibold text-sm cursor-pointer inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Try another URL
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 sm:px-6 lg:px-8 py-10 mt-16 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="divider mb-8" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-400">Zincad</span>
            </div>
            <p className="text-xs text-slate-600 text-center max-w-xs">
              Zincad does not host or store any videos. All downloads are sourced directly from the original platform.
            </p>
            <p className="text-xs text-slate-700 font-medium">zincad.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
