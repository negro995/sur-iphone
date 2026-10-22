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

/** Battery health as a number (88 for "88%"), or null when not a plain percentage. */
export function batteryLevel(p: Pick<Product, "battery">): number | null {
  const m = p.battery?.match(/^(\d{1,3})\s*%$/);
  const n = m ? Number(m[1]) : NaN;
  return n >= 0 && n <= 100 ? n : null;
}

/** iPhone generation used for ordering: 11–17 from the title, X/XS/XR → 10, SE → 9, 8 → 8. */
export function modelGeneration(p: Pick<Product, "title" | "generation">): number | null {
  if (p.generation) return p.generation;
  const t = normalizeText(p.title);
  if (!/iphone/.test(t)) return null;
  if (/iphone\s*x(s|r)?\b/.test(t)) return 10;
  if (/iphone\s*se\b/.test(t)) return 9;
  const m = t.match(/iphone\s*(\d{1,2})(?!\d)/);
  return m ? Number(m[1]) : null;
}

/** Line-up position inside a generation: Pro Max > Pro > Plus > base > e / mini. */
export function modelTier(title: string): number {
  const t = normalizeText(title);
  if (/pro\s*max|\bxs\s*max/.test(t)) return 5;
  if (/\bpro\b/.test(t)) return 4;
  if (/\bplus\b|\bair\b/.test(t)) return 3;
  if (/\bmini\b|\b\d{2}\s*e\b|\b\d{2}e\b/.test(t)) return 1;
  return 2;
}

/** Display name for the generation group ("iPhone 16", "iPhone X / XS / XR"). */
export function generationLabel(gen: number) {
  if (gen === 10) return "iPhone X / XS / XR";
  if (gen === 9) return "iPhone SE";
  return `iPhone ${gen}`;
}

/**
 * Sequential model order: category (iPhones, Combos, Accesorios), then generation
 * ("desc": 17 → 11, "asc": 11 → 17), line-up tier, capacity and price; sold-out units
 * stay inside their model group, after the available ones.
 */
export function compareModels(a: Product, b: Product, dir: "asc" | "desc" = "desc") {
  const sign = dir === "asc" ? 1 : -1;
  const ga = modelGeneration(a);
  const gb = modelGeneration(b);
  const pa = finalPrice(a);
  const pb = finalPrice(b);
  return (
    CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] ||
    Number(ga == null) - Number(gb == null) ||
    (ga != null && gb != null ? sign * (ga - gb) : 0) ||
    sign * (modelTier(a.title) - modelTier(b.title)) ||
    (storageGB(a) ?? 0) - (storageGB(b) ?? 0) ||
    Number(b.available) - Number(a.available) ||
    (pa ?? Infinity) - (pb ?? Infinity) ||
    a.title.localeCompare(b.title, "es")
  );
}

const CATEGORY_ORDER: Record<Category, number> = { iPhones: 0, Combos: 1, Accesorios: 2 };

export function sortByModel(products: Product[], dir: "asc" | "desc" = "desc") {
  return [...products].sort((a, b) => compareModels(a, b, dir));
}
