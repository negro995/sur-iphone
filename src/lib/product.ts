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
