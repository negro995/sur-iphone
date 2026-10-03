"use client";

import { useEffect, useRef, useState } from "react";
import { BatteryCharging, Cable, Gift, Headphones, Layers, Package, PlugZap, Smartphone } from "lucide-react";
import type { Product } from "@/lib/types";
import { PhoneArt } from "./phone-art";

function AccessoryIcon({ title, className }: { title: string; className: string }) {
  const props = { className, strokeWidth: 1.25 };
  const t = title.toLowerCase();
  if (/cable/.test(t)) return <Cable {...props} />;
  if (/cargador|adaptador|fuente|cabezal/.test(t)) return <PlugZap {...props} />;
  if (/auricular|airpods/.test(t)) return <Headphones {...props} />;
  if (/vidrio|templado|protector/.test(t)) return <Layers {...props} />;
  if (/funda|case/.test(t)) return <Smartphone {...props} />;
  if (/magsafe|power ?bank|bateria|batería/.test(t)) return <BatteryCharging {...props} />;
  return <Package {...props} />;
}

export function ProductArt({ product: p }: { product: Product }) {
  if (p.category === "iPhones") return <PhoneArt generation={p.generation} pro={/pro/i.test(p.title)} />;
  const tint =
    p.category === "Combos"
      ? "from-amber-400/25 to-rose-500/10 text-amber-200"
      : "from-sky-400/20 to-indigo-500/10 text-sky-200";
  return (
    <div className={`grid aspect-square h-full max-h-40 place-items-center rounded-[2rem] border border-white/10 bg-gradient-to-br ${tint} shadow-[0_20px_40px_rgba(0,0,0,0.5)]`}>
      {p.category === "Combos" ? (
        <Gift className="size-14" strokeWidth={1.25} />
      ) : (
        <AccessoryIcon title={p.title} className="size-14" />
      )}
    </div>
  );
}

/** Product photo from the sheet; falls back to generated art if missing or broken. */
export function ProductImage({ product: p }: { product: Product }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const src = p.imageUrl;

  useEffect(() => {
    // The image may have errored before hydration attached onError.
    const img = ref.current;
    if (img?.complete) {
      if (img.naturalWidth === 0) setFailedSrc(img.src);
      else setLoaded(true);
    }
  }, [src]);

  if (!src || failedSrc === src) return <ProductArt product={p} />;
  return (
    <div className="relative h-full w-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <ProductArt product={p} />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary hosts from the sheet */}
      <img
        ref={ref}
        src={src}
        alt={p.title}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setFailedSrc(src)}
        className={`h-full w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
