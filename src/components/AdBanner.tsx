"use client";

import { useEffect, useRef } from "react";

interface AdBannerProps {
  slot: string;
  format: "horizontal" | "rectangle";
}

export function AdBanner({ slot, format }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      const adsbygoogle = (window as unknown as Record<string, unknown[]>).adsbygoogle;
      if (adsbygoogle) {
        adsbygoogle.push({});
        pushed.current = true;
      }
    } catch {
      // AdSense not loaded — that's fine
    }
  }, []);

  return (
    <div
      ref={adRef}
      className={`flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 overflow-hidden ${
        format === "horizontal"
          ? "h-[50px] sm:h-[90px]"
          : "h-[250px] max-w-[300px] mx-auto"
      }`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format === "horizontal" ? "horizontal" : "rectangle"}
        data-full-width-responsive="true"
      />
    </div>
  );
}
