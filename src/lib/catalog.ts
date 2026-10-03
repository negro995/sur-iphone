import { STORE } from "./config";
import type { Catalog, Product } from "./types";

export const REVALIDATE_SECONDS = 60;

type Grid = string[][];

const SOLD_OUT = /(agotad|sin stock|vendid|no disponible|reservad)/i;

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

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
  return Number.isFinite(v) ? v : null;
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

function findCol(header: string[], ...patterns: RegExp[]) {
  return header.findIndex((h) => patterns.some((p) => p.test(normalize(h))));
}

export function gridToProducts(grid: Grid, usdRate: number | null): Product[] {
  const headerIdx = grid.findIndex((r) => r.some((c) => /modelo/.test(normalize(c))));
  if (headerIdx === -1) throw new Error("No se encontró la fila de encabezados (Modelo)");
  const header = grid[headerIdx].map(String);

  const col = {
    id: findCol(header, /^id/, /codigo/),
    model: findCol(header, /modelo/),
    storage: findCol(header, /almacenamiento/, /capacidad/, /\bgb\b/),
    condition: findCol(header, /condicion/, /estado del equipo/),
    battery: findCol(header, /bateria/),
    usd: findCol(header, /usd/, /dolar/, /u\$s/),
    cash: findCol(header, /precio contado/, /contado/),
    stock: findCol(header, /stock/, /disponib/),
  };

  const products: Product[] = [];
  for (const r of grid.slice(headerIdx + 1)) {
    const cell = (i: number) => (i >= 0 ? String(r[i] ?? "").trim() : "");
    const model = cell(col.model);
    if (!/iphone/i.test(model)) continue;

    let priceUSD: number | null = null;
    const usd = parseMoney(cell(col.usd));
    if (col.usd >= 0 && usd) priceUSD = Math.round(usd);
    else {
      const ars = parseMoney(cell(col.cash));
      if (ars && usdRate) priceUSD = Math.round(ars / usdRate);
    }

    const batteryRaw = cell(col.battery);
    const battery =
      batteryRaw && !/^(n\/?a|-|—|)$/i.test(batteryRaw)
        ? /^\d+$/.test(batteryRaw)
          ? `${batteryRaw}%`
          : batteryRaw
        : null;

    const stock = cell(col.stock) || "Disponible";
    const gen = model.match(/iphone\s*(\d{2})/i);

    products.push({
      id: cell(col.id) || `${products.length + 1}`,
      model: model.replace(/iphone/i, "iPhone"),
      generation: gen ? Number(gen[1]) : null,
      storage: cell(col.storage).replace(/\s*gb$/i, " GB"),
      condition: cell(col.condition) || "Usado",
      battery,
      priceUSD,
      stock,
      available: !SOLD_OUT.test(stock),
    });
  }
  return products;
}

async function fetchGrid(): Promise<{ grid: Grid; source: Catalog["source"] }> {
  const key = process.env.GOOGLE_SHEETS_API_KEY;
  const opts = { next: { revalidate: REVALIDATE_SECONDS, tags: ["catalog"] } };
  if (key) {
    const range = encodeURIComponent(process.env.GOOGLE_SHEET_RANGE ?? "A1:Z200");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${STORE.sheetId}/values/${range}?valueRenderOption=FORMATTED_VALUE&key=${key}`;
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`Google Sheets API ${res.status}`);
    const data = (await res.json()) as { values?: string[][] };
    return { grid: data.values ?? [], source: "sheets-api" };
  }
  const gid = process.env.GOOGLE_SHEET_GID ?? "0";
  const url = `https://docs.google.com/spreadsheets/d/${STORE.sheetId}/export?format=csv&gid=${gid}`;
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`Google Sheets CSV ${res.status}`);
  return { grid: parseCSV(await res.text()), source: "csv" };
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

export async function getCatalog(): Promise<Catalog> {
  try {
    const [{ grid, source }, rate] = await Promise.all([fetchGrid(), fetchUsdRate()]);
    const products = gridToProducts(grid, rate).sort(
      (a, b) =>
        Number(b.available) - Number(a.available) ||
        (b.generation ?? 0) - (a.generation ?? 0) ||
        (a.priceUSD ?? 0) - (b.priceUSD ?? 0),
    );
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
