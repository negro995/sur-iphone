import { STORE } from "./config";
import { normalizeImageUrl, normalizeText, sortByModel } from "./product";
import type { Catalog, Category, Product, Testimonial, UsdRate } from "./types";

export const REVALIDATE_SECONDS = 60;

type Grid = string[][];

const SOLD_OUT = /(agotad|sin stock|vendid|no disponible|reservad)/i;
const LOW_STOCK = /(ultim|unic[oa] (unidad|en stock)|1 unidad|pocas|poco stock|limitad|queda(n)? (1|pocos?))/i;
const AVAILABILITY = /(agotad|sin stock|vendid|no disponible|reservad|disponible|en stock|ultim|pocas|limitad)/i;
const FALSY = /^(no|n|false|falso|0)$/i;
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

/** "88" / "88 %" / "0,88" → "88%"; empty, "N/A" or "consultar" → null (the card asks to consult). */
export function parseBattery(raw: string): string | null {
  const v = raw.trim();
  if (!v || /^(n\/?a|-|—|no aplica|\?+|s\/?d)$/i.test(v) || /consult|pregunt/i.test(v)) return null;
  const m = v.match(/^(\d+([.,]\d+)?)\s*%?$/);
  if (m) {
    const n = Number(m[1].replace(",", "."));
    const isFraction = /[.,]/.test(m[1]) && n <= 1;
    const pct = Math.round(isFraction ? n * 100 : n);
    return pct > 0 && pct <= 100 ? `${pct}%` : null;
  }
  return v;
}

/**
 * Reads the `stock` cell (or `estado` when it holds availability): a number of units
 * ("0", "1", "3 unidades") or text ("Disponible", "Agotado", "Último", "Pocas unidades").
 */
export function parseStock(raw: string): Pick<Product, "stock" | "quantity" | "available" | "lowStock"> {
  const v = raw.trim();
  const units = v.match(/^(\d+)\s*(u|un|unid|unidad|unidades)?\.?$/i);
  if (units) {
    const quantity = Number(units[1]);
    if (quantity <= 0) return { stock: "Agotado", quantity: 0, available: false, lowStock: false };
    return { stock: quantity === 1 ? "Último en stock" : "Disponible", quantity, available: true, lowStock: quantity === 1 };
  }
  if (!v) return { stock: "Disponible", quantity: null, available: true, lowStock: false };
  const available = !SOLD_OUT.test(v);
  return { stock: v, quantity: null, available, lowStock: available && LOW_STOCK.test(normalizeText(v)) };
}

function emptyToNull(s: string) {
  return s && !/^(n\/?a|-|—)$/i.test(s) ? s : null;
}

function isTestimonialHeader(row: string[]) {
  return row.some((c) => /^(testimonio|opinion|resena|comentario)/.test(headerKey(String(c))));
}

function isHeaderRow(row: string[]) {
  if (isTestimonialHeader(row)) return false;
  const keys = row.map((c) => headerKey(String(c)));
  const hasTitle = keys.some((h) => /^(titulo|producto|nombre)$/.test(h) || /modelo/.test(h));
  const others = keys.filter((h) =>
    /^(id\b|categoria|precio|stock|bateria|estado|condicion|almacenamiento|imagen|es oferta)/.test(h),
  ).length;
  return hasTitle && others >= 1;
}

/** A tab may hold several blocks (e.g. iPhones, then accessories below), each with its own header row. */
export function gridToProducts(grid: Grid, usdRate: number | null, keyPrefix = ""): Product[] {
  const starts = grid.flatMap((r, i) => (isHeaderRow(r) ? [i] : []));
  const bounds = sectionBounds(grid);
  return starts.flatMap((start, s) =>
    parseSection(
      grid[start].map(String),
      grid.slice(start + 1, bounds.find((b) => b > start) ?? grid.length),
      usdRate,
      s ? `${keyPrefix}${s}-` : keyPrefix,
    ),
  );
}

export function hasProductHeader(grid: Grid) {
  return grid.some(isHeaderRow);
}

function sectionBounds(grid: Grid) {
  return grid.flatMap((r, i) => (isHeaderRow(r) || isTestimonialHeader(r) ? [i] : []));
}

/** Testimonial blocks: a header row with `testimonio` (+ cliente, ciudad, captura_url, estrellas). */
export function gridToTestimonials(grid: Grid, keyPrefix = ""): Testimonial[] {
  const bounds = sectionBounds(grid);
  return grid.flatMap((row, start) => {
    if (!isTestimonialHeader(row)) return [];
    const header = row.map(String);
    const col = {
      quote: findCol(header, (h) => /^(testimonio|opinion|resena|comentario)/.test(h)),
      name: findCol(header, (h) => /^(cliente|nombre|autor)/.test(h)),
      location: findCol(header, (h) => /^(ciudad|localidad|ubicacion|lugar)/.test(h)),
      image: findCol(header, (h) => /captura|imagen|foto/.test(h)),
      rating: findCol(header, (h) => /estrellas|puntaje|calificacion/.test(h)),
    };
    const rows = grid.slice(start + 1, bounds.find((b) => b > start) ?? grid.length);
    return rows.flatMap((r, i) => {
      const cell = (j: number) => (j >= 0 ? String(r[j] ?? "").trim() : "");
      const quote = cell(col.quote).replace(/^["“]|["”]$/g, "");
      if (!quote) return [];
      const stars = Number(cell(col.rating).replace(/[^\d]/g, "") || cell(col.rating).split("⭐").length - 1);
      return [
        {
          id: `${keyPrefix}${start}-${i}`,
          quote,
          name: emptyToNull(cell(col.name)),
          location: emptyToNull(cell(col.location)),
          imageUrl: normalizeImageUrl(cell(col.image)),
          rating: stars >= 1 && stars <= 5 ? stars : null,
        },
      ];
    });
  });
}

function parseSection(header: string[], rows: Grid, usdRate: number | null, keyPrefix: string): Product[] {

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
  const toUSD = (raw: string, isUSD = usesUSD) => {
    const v = parseMoney(raw);
    if (v == null) return null;
    if (isUSD) return Math.round(v);
    return usdRate ? Math.round(v / usdRate) : null;
  };

  const products: Product[] = [];
  rows.forEach((r, i) => {
    const cell = (c: number) => (c >= 0 ? String(r[c] ?? "").trim() : "");
    const rawTitle = cell(col.title);
    if (!rawTitle) return;
    const title = rawTitle.replace(/iphone/gi, "iPhone");
    const category = parseCategory(cell(col.category), title);

    const priceUSD = toUSD(cell(col.usd), true) ?? toUSD(cell(col.cash), false);
    const offerHeaderUSD = col.offer >= 0 && /usd|dolar/.test(headerKey(header[col.offer]));
    let offerPriceUSD = toUSD(cell(col.offer), offerHeaderUSD || usesUSD);
    if (offerPriceUSD != null && priceUSD != null && offerPriceUSD >= priceUSD) offerPriceUSD = null;
    const flagged = TRUTHY.test(cell(col.offerFlag));
    if (FALSY.test(cell(col.offerFlag))) offerPriceUSD = null;

    const rawState = cell(col.state);
    const stateIsAvailability = AVAILABILITY.test(normalizeText(rawState));
    const stock = parseStock(cell(col.stock) || (stateIsAvailability ? rawState : ""));
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
      state: stateIsAvailability ? null : emptyToNull(rawState),
      battery: category === "iPhones" || /iphone/i.test(title) ? parseBattery(cell(col.battery)) : null,
      priceUSD,
      offerPriceUSD,
      isOffer: flagged || offerPriceUSD != null,
      imageUrl: normalizeImageUrl(cell(col.image)),
      ...stock,
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

  if (!key && !csvUrls && process.env.GOOGLE_SHEET_RANGE?.includes("!")) {
    console.warn("GOOGLE_SHEET_RANGE con pestañas requiere GOOGLE_SHEETS_API_KEY; sin key usá GOOGLE_SHEET_GID.");
  }

  if (key && !csvUrls) {
    const ranges = (process.env.GOOGLE_SHEET_RANGE ? list(process.env.GOOGLE_SHEET_RANGE, "") : await allTabRanges(key, opts))
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

/** Without GOOGLE_SHEET_RANGE every tab is read (e.g. "Catalogo" + "Testimonios"). */
async function allTabRanges(key: string, opts: RequestInit) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${STORE.sheetId}?fields=sheets.properties.title&key=${key}`,
    opts,
  );
  if (!res.ok) return ["A1:Z500"];
  const data = (await res.json()) as { sheets?: { properties?: { title?: string } }[] };
  const titles = (data.sheets ?? []).flatMap((s) => (s.properties?.title ? [s.properties.title] : []));
  return titles.length ? titles.map((t) => `'${t.replace(/'/g, "''")}'!A1:Z500`) : ["A1:Z500"];
}

export const RATE_SOURCE = process.env.USD_RATE_SOURCE ?? "blue";

/** ARS per USD: converts the sheet's peso prices and powers the ARS estimate in the UI. */
async function fetchUsdRate(): Promise<UsdRate | null> {
  const fixed = Number(process.env.USD_ARS_RATE);
  if (fixed > 0) return { ars: fixed, label: "Cotización", updatedAt: null };
  try {
    const res = await fetch(`https://dolarapi.com/v1/dolares/${RATE_SOURCE}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { venta?: number; nombre?: string; fechaActualizacion?: string };
    if (!data.venta || data.venta <= 0) return null;
    return { ars: data.venta, label: `Dólar ${data.nombre ?? RATE_SOURCE}`, updatedAt: data.fechaActualizacion ?? null };
  } catch {
    return null;
  }
}

/** Newest iPhones first (17 → 11), grouped by model; see `compareModels`. */
export function sortProducts(products: Product[]) {
  return sortByModel(products, "desc");
}

export async function getCatalog(): Promise<Catalog> {
  try {
    const [{ grids, source }, rate] = await Promise.all([fetchGrids(), fetchUsdRate()]);
    if (!grids.some(hasProductHeader)) throw new Error("No se encontró la fila de encabezados (titulo / Modelo)");
    const products = sortProducts(grids.flatMap((g, i) => gridToProducts(g, rate?.ars ?? null, `${i}-`)));
    const testimonials = grids.flatMap((g, i) => gridToTestimonials(g, `${i}-`));
    return { products, testimonials, usdRate: rate, updatedAt: new Date().toISOString(), source };
  } catch (e) {
    return {
      products: [],
      testimonials: [],
      usdRate: null,
      updatedAt: new Date().toISOString(),
      source: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
