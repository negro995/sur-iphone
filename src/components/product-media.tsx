"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { PhoneArt } from "./phone-art";
import { AccessoryArt } from "./accessory-art";

export function ProductArt({ product: p }: { product: Product }) {
  if (p.category === "iPhones") return <PhoneArt title={p.title} generation={p.generation} />;
  return <AccessoryArt title={p.title} />;
}

/** Product photo from the sheet; falls back to generated art if missing or broken. */
export function ProductImage({ product: p }: { product: Product }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const src = p.imageUrl ? `/api/product-image?src=${encodeURIComponent(p.imageUrl)}` : null;

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
        className={`h-full w-full object-contain transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
