import type { Category, Product } from "./types";

export const CATEGORIES: Category[] = ["iPhones", "Accesorios", "Combos"];

export function finalPrice(p: Product) {
  return p.offerPriceUSD ?? p.priceUSD;
}

export function discountPercent(p: Product) {
  if (p.offerPriceUSD == null || p.priceUSD == null || p.offerPriceUSD >= p.priceUSD) return null;
  return Math.round((1 - p.offerPriceUSD / p.priceUSD) * 100);
}

export function normalizeText(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Token search that tolerates "128gb" vs "128 GB" and missing accents. */
export function matchesQuery(p: Product, query: string) {
  const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const hay = normalizeText(
    [p.title, p.category, p.storage, p.condition, p.state, p.battery].filter(Boolean).join(" "),
  );
  const words = hay.split(/[^a-z0-9+%]+/).filter(Boolean);
  const compact = hay.replace(/[^a-z0-9]/g, "");
  return tokens.every((t) => {
    if (/^\d+$/.test(t)) return words.includes(t);
    if (words.some((w) => w.startsWith(t))) return true;
    const c = t.replace(/[^a-z0-9]/g, "");
    return /\d/.test(c) && /[a-z]/.test(c) && compact.includes(c);
  });
}

/** Accepts direct image URLs and Google Drive share links. */
export function normalizeImageUrl(raw: string | null | undefined): string | null {
  const url = raw?.trim();
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const drive =
    url.match(/drive\.google\.com\/file\/d\/([\w-]+)/) ??
    url.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([\w-]+)/);
  if (drive) return `https://lh3.googleusercontent.com/d/${drive[1]}=w800`;
  return url;
}

/** Sorts by final price; products without price always go last. */
export function sortByPrice(products: Product[], dir: "asc" | "desc") {
  const sign = dir === "asc" ? 1 : -1;
  return [...products].sort((a, b) => {
    const pa = finalPrice(a);
    const pb = finalPrice(b);
    return (
      Number(b.available) - Number(a.available) ||
      Number(pa == null) - Number(pb == null) ||
      (pa != null && pb != null ? sign * (pa - pb) : 0)
    );
  });
}

/** Storage in GB from the storage column or the title ("1 TB" → 1024). */
export function storageGB(p: Product): number | null {
  const m = `${p.storage ?? ""} ${p.title}`.match(/(\d+)\s*(gb|tb)\b/i);
  if (!m) return null;
  return Number(m[1]) * (/tb/i.test(m[2]) ? 1024 : 1);
}

export function storageLabel(gb: number) {
  return gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`;
}

export type ConditionGroup = "Nuevo" | "Usado";

export function conditionGroup(p: Product): ConditionGroup | null {
  const t = normalizeText(`${p.condition ?? ""} ${p.state ?? ""}`);
  if (/usad|reacond|seminuev|como nuevo|open ?box|exhibicion/.test(t)) return "Usado";
  if (/nuev|sellad/.test(t)) return "Nuevo";
  return null;
}
