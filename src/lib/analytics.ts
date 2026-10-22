type Params = Record<string, string | number | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/** WhatsApp / checkout intents measured as conversions. */
export type Intent = "contado" | "financiacion" | "transferencia" | "consulta" | "comprobante";

const META_EVENT: Record<Intent, string> = {
  contado: "Lead",
  financiacion: "Lead",
  transferencia: "InitiateCheckout",
  comprobante: "Lead",
  consulta: "Contact",
};

/** Sends an event to GA4 (gtag) and Meta Pixel (fbq) when they are loaded. */
export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", event, params);
  window.fbq?.("trackCustom", event, params);
}

/** Conversion click: GA4 `whatsapp_click` + `generate_lead`, Meta standard event by intent. */
export function trackConversion(intent: Intent, params: { product?: string; value?: number } = {}) {
  if (typeof window === "undefined") return;
  const p: Params = { intent, product: params.product, value: params.value, currency: params.value ? "USD" : undefined };
  const event = intent === "transferencia" ? "begin_checkout" : "whatsapp_click";
  window.gtag?.("event", event, p);
  if (intent === "contado" || intent === "financiacion") window.gtag?.("event", "generate_lead", p);
  window.fbq?.("track", META_EVENT[intent], {
    content_name: params.product,
    content_category: intent,
    ...(params.value ? { value: params.value, currency: "USD" } : {}),
  });
  window.fbq?.("trackCustom", event, p);
}

/** `data-track` attributes read by the global click listener in <Analytics />. */
export function trackAttrs(intent: Intent, product?: string, value?: number | null) {
  return {
    "data-track": intent,
    ...(product ? { "data-track-product": product } : {}),
    ...(value != null ? { "data-track-value": String(value) } : {}),
  };
}
