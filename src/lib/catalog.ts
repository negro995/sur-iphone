import { STORE } from "./config";
import { normalizeImageUrl, normalizeText } from "./product";
import type { Catalog, Category, Product } from "./types";

export const REVALIDATE_SECONDS = 60;

type Grid = string[][];

const SOLD_OUT = /(agotad|sin stock|vendid|no disponible|reservad)/i;
const TRUTHY = /^(si|sí|s|true|verdadero|x|1|yes|oferta|✓|✔|✅)$/i;
const ACCESSORY = /(cargador|cable|adaptador|auricular|airpods|funda|case|vidrio|templado|protector|magsafe|power ?bank|fuente|cabezal|soporte|malla|correa)/i;

/** Parses "$1.390.000", "$ 200.000", "1390000", "1.234,56", "USD 450" */
export function parseMoney(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.,-]/g, "");
  if (!cleaned) return null;
  let n: string;
  if (cleaned.includes(",") && cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
    n = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    n = cleaned.replace(/\./g, "");
  } else {
    n = cleaned.replace(/,/g, "");
  }
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : null;
}

export function parseCSV(text: string): Grid {
  const rows: Grid = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Header key with accents removed and "_"/"-" treated as spaces. */
function headerKey(h: string) {
  return normalizeText(h).replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function findCol(header: string[], test: (h: string) => boolean) {
  return header.findIndex((h) => test(headerKey(h)));
}

export function parseCategory(raw: string, title: string): Category {
  const c = normalizeText(raw);
  if (/^iphone/.test(c) || /^celular/.test(c) || /^telefono/.test(c)) return "iPhones";
  if (/^accesorio/.test(c)) return "Accesorios";
  if (/^combo/.test(c) || /^promo/.test(c)) return "Combos";
  if (/combo|promo/i.test(title)) return "Combos";
  if (ACCESSORY.test(title)) return "Accesorios";
  if (/iphone/i.test(title)) return "iPhones";
  return "Accesorios";
}

function parseBattery(raw: string): string | null {
  if (!raw || /^(n\/?a|-|—|no aplica)$/i.test(raw)) return null;
  if (/^\d+([.,]\d+)?$/.test(raw)) {
    const n = Number(raw.replace(",", "."));
    return `${Math.round(n <= 1 ? n * 100 : n)}%`;
  }
  return raw;
}

function emptyToNull(s: string) {
  return s && !/^(n\/?a|-|—)$/i.test(s) ? s : null;
}

export function gridToProducts(grid: Grid, usdRate: number | null, keyPrefix = ""): Product[] {
  const headerIdx = grid.findIndex((r) =>
    r.some((c) => /^(titulo|modelo|producto|nombre)/.test(headerKey(String(c))) || /modelo/.test(headerKey(String(c)))),
  );
  if (headerIdx === -1) throw new Error("No se encontró la fila de encabezados (titulo / Modelo)");
  const header = grid[headerIdx].map(String);

  const col = {
    id: findCol(header, (h) => /^id\b/.test(h) || /codigo/.test(h)),
    title: findCol(header, (h) => /^(titulo|producto|nombre)/.test(h) || /modelo/.test(h)),
    category: findCol(header, (h) => /^categoria/.test(h)),
    storage: findCol(header, (h) => /almacenamiento|capacidad/.test(h)),
    condition: findCol(header, (h) => /^condicion/.test(h)),
    state: findCol(header, (h) => /^estado( del equipo| equipo)?$/.test(h)),
    battery: findCol(header, (h) => /bateria/.test(h)),
    usd: findCol(header, (h) => /(usd|dolar|u\$s)/.test(h) && !/oferta/.test(h)),
    offer: findCol(header, (h) => /precio.*oferta|oferta.*precio/.test(h)),
    offerFlag: findCol(header, (h) => /^(es )?oferta$|^en oferta$|^destacad/.test(h)),
    cash: findCol(header, (h) => /contado/.test(h)),
    image: findCol(header, (h) => /imagen|foto|image/.test(h)),
    stock: findCol(header, (h) => /stock|disponib/.test(h)),
  };

  const usesUSD = col.usd >= 0;
  const toUSD = (raw: string, forceUSD = false) => {
    const v = parseMoney(raw);
    if (v == null) return null;
    if (forceUSD || usesUSD) return Math.round(v);
    return usdRate ? Math.round(v / usdRate) : null;
  };

  const products: Product[] = [];
  grid.slice(headerIdx + 1).forEach((r, i) => {
    const cell = (c: number) => (c >= 0 ? String(r[c] ?? "").trim() : "");
    const rawTitle = cell(col.title);
    if (!rawTitle) return;
    const title = rawTitle.replace(/iphone/gi, "iPhone");
    const category = parseCategory(cell(col.category), title);

    const priceUSD = usesUSD ? toUSD(cell(col.usd)) : toUSD(cell(col.cash));
    const offerHeaderUSD = col.offer >= 0 && /usd|dolar/.test(headerKey(header[col.offer]));
    let offerPriceUSD = toUSD(cell(col.offer), offerHeaderUSD);
    if (offerPriceUSD != null && priceUSD != null && offerPriceUSD >= priceUSD) offerPriceUSD = null;
    const flagged = TRUTHY.test(cell(col.offerFlag));

    const stock = cell(col.stock) || "Disponible";
    const gen = category === "iPhones" ? title.match(/iphone\s*(\d{2})/i) : null;
    const storage = emptyToNull(cell(col.storage));

    products.push({
      key: `${keyPrefix}${i}`,
      id: cell(col.id) || `${i + 1}`,
      title,
      category,
      generation: gen ? Number(gen[1]) : null,
      storage: storage ? storage.replace(/\s*gb$/i, " GB").replace(/\s*tb$/i, " TB") : null,
      condition: emptyToNull(cell(col.condition)),
      state: emptyToNull(cell(col.state)),
      battery: parseBattery(cell(col.battery)),
      priceUSD,
      offerPriceUSD,
      isOffer: flagged || offerPriceUSD != null,
      imageUrl: normalizeImageUrl(cell(col.image)),
      stock,
      available: !SOLD_OUT.test(stock),
    });
  });
  return products;
}

function list(env: string | undefined, fallback: string) {
  return (env ?? fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function fetchGrids(): Promise<{ grids: Grid[]; source: Catalog["source"] }> {
  const opts = { next: { revalidate: REVALIDATE_SECONDS, tags: ["catalog"] } };
  const key = process.env.GOOGLE_SHEETS_API_KEY;
  const csvUrls = process.env.CATALOG_CSV_URL ? list(process.env.CATALOG_CSV_URL, "") : null;

  if (key && !csvUrls) {
    const ranges = list(process.env.GOOGLE_SHEET_RANGE, "A1:Z500")
      .map((r) => `ranges=${encodeURIComponent(r)}`)
      .join("&");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${STORE.sheetId}/values:batchGet?${ranges}&valueRenderOption=FORMATTED_VALUE&key=${key}`;
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`Google Sheets API ${res.status}`);
    const data = (await res.json()) as { valueRanges?: { values?: string[][] }[] };
    return { grids: (data.valueRanges ?? []).map((v) => v.values ?? []), source: "sheets-api" };
  }

  const urls =
    csvUrls ??
    list(process.env.GOOGLE_SHEET_GID, "0").map(
      (gid) => `https://docs.google.com/spreadsheets/d/${STORE.sheetId}/export?format=csv&gid=${gid}`,
    );
  const grids = await Promise.all(
    urls.map(async (url) => {
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error(`Google Sheets CSV ${res.status}`);
      return parseCSV(await res.text());
    }),
  );
  return { grids, source: "csv" };
}

/** ARS per USD used to convert the sheet's peso prices when it has no USD column. */
async function fetchUsdRate(): Promise<number | null> {
  const fixed = Number(process.env.USD_ARS_RATE);
  if (fixed > 0) return fixed;
  const casa = process.env.USD_RATE_SOURCE ?? "blue";
  try {
    const res = await fetch(`https://dolarapi.com/v1/dolares/${casa}`, {
      next: { revalidate: 900 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { venta?: number };
    return data.venta && data.venta > 0 ? data.venta : null;
  } catch {
    return null;
  }
}

const CATEGORY_ORDER: Record<Category, number> = { iPhones: 0, Combos: 1, Accesorios: 2 };

export function sortProducts(products: Product[]) {
  return [...products].sort(
    (a, b) =>
      Number(b.available) - Number(a.available) ||
      CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] ||
      (b.generation ?? 0) - (a.generation ?? 0) ||
      (a.priceUSD ?? 0) - (b.priceUSD ?? 0),
  );
}

export async function getCatalog(): Promise<Catalog> {
  try {
    const [{ grids, source }, rate] = await Promise.all([fetchGrids(), fetchUsdRate()]);
    const products = sortProducts(grids.flatMap((g, i) => gridToProducts(g, rate, `${i}-`)));
    return { products, updatedAt: new Date().toISOString(), source };
  } catch (e) {
    return {
      products: [],
      updatedAt: new Date().toISOString(),
      source: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
