"use client";

import { useEffect } from "react";
import Script from "next/script";
import { type Intent, trackConversion } from "@/lib/analytics";
import { STORE } from "@/lib/config";

const INTENTS = new Set<Intent>(["contado", "financiacion", "transferencia", "consulta", "comprobante"]);

/** Fallback for WhatsApp links without `data-track`: the financing line vs. the sales line. */
function intentFromHref(href: string): Intent | null {
  if (!/wa\.me\//.test(href)) return null;
  return href.includes(STORE.whatsapp.financing) ? "financiacion" : "consulta";
}

/** GA4 (`gaId`) and Meta Pixel (`pixelId`) plus one click listener for every WhatsApp / checkout button. */
export function Analytics({ gaId, pixelId }: { gaId?: string; pixelId?: string }) {
  useEffect(() => {
    if (!gaId && !pixelId) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track], a[href*='wa.me/']");
      if (!el) return;
      const attr = el.dataset.track as Intent | undefined;
      const intent = attr && INTENTS.has(attr) ? attr : intentFromHref(el.getAttribute("href") ?? "");
      if (!intent) return;
      const value = Number(el.dataset.trackValue);
      trackConversion(intent, { product: el.dataset.trackProduct, value: value > 0 ? value : undefined });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [gaId, pixelId]);

  return (
    <>
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});`}
          </Script>
        </>
      )}
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(pixelId)});fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
