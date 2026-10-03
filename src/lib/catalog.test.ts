import { describe, expect, it } from "vitest";
import { gridToProducts, parseCSV, parseMoney } from "./catalog";
import { matchesQuery, normalizeImageUrl } from "./product";

describe("parseMoney", () => {
  it("parses AR and plain formats", () => {
    expect(parseMoney("$1.390.000")).toBe(1390000);
    expect(parseMoney("$ 200.000")).toBe(200000);
    expect(parseMoney("USD 450")).toBe(450);
    expect(parseMoney("1.234,50")).toBe(1234.5);
    expect(parseMoney("")).toBeNull();
  });
});

describe("gridToProducts: legacy sheet (ARS, Spanish headers)", () => {
  const csv = [
    ",,,,,,,,,,,",
    ",ID / Código,Modelo de iPhone,Almacenamiento (GB),Condición,Batería (%),Costo Base ($),,Precio Contado ($),3 Cuotas: Valor Cuota ($),3 Cuotas: Total ($),Stock / Estado",
    ",1,iPhone 11,64 GB,Usado,N/A,$460.000,,$460.000,$ 200.000,$ 600.000,Disponible",
    ",11,iPhone 16,128 GB,Usado,+90% original,$1.260.000,,$1.260.000,$ 540.000,$ 1.620.000,Vendido",
  ].join("\n");
  const [a, b] = gridToProducts(parseCSV(csv), 1000);

  it("converts ARS cash price to USD and infers category", () => {
    expect(a).toMatchObject({ title: "iPhone 11", category: "iPhones", generation: 11, priceUSD: 460, storage: "64 GB", battery: null, state: null });
  });
  it("does not treat 'Stock / Estado' as the device state", () => {
    expect(b).toMatchObject({ battery: "+90% original", state: null, stock: "Vendido", available: false });
  });
});

describe("gridToProducts: new snake_case sheet", () => {
  const csv = [
    "id,titulo,categoria,almacenamiento,precio_usd,precio_oferta,bateria,estado,imagen_url,es_oferta,stock",
    "A1,iPhone 13 Pro,iPhones,128gb,650,599,88,Excelente,https://drive.google.com/file/d/abc_123/view?usp=sharing,,Disponible",
    "A2,Cargador 20W USB-C,Accesorios,,25,,,,not-a-url,si,",
    "A3,Combo iPhone 12 + Funda,combos,,520,,100%,Reacondicionado A+,,no,Agotado",
  ].join("\n");
  const [p, acc, combo] = gridToProducts(parseCSV(csv), null);

  it("uses USD prices directly and detects offers", () => {
    expect(p).toMatchObject({ id: "A1", category: "iPhones", priceUSD: 650, offerPriceUSD: 599, isOffer: true, battery: "88%", state: "Excelente", storage: "128 GB" });
    expect(p.imageUrl).toBe("https://lh3.googleusercontent.com/d/abc_123=w800");
  });
  it("handles accessories with flag-only offers and invalid images", () => {
    expect(acc).toMatchObject({ category: "Accesorios", generation: null, priceUSD: 25, offerPriceUSD: null, isOffer: true, imageUrl: null, available: true });
  });
  it("parses combos and sold-out stock", () => {
    expect(combo).toMatchObject({ category: "Combos", generation: null, isOffer: false, battery: "100%", state: "Reacondicionado A+", available: false });
  });
  it("search tolerates spacing and accents", () => {
    expect(matchesQuery(p, "iphone 13 128gb")).toBe(true);
    expect(matchesQuery(p, "13 pro excelente")).toBe(true);
    expect(matchesQuery(acc, "cargador 20w")).toBe(true);
    expect(matchesQuery(p, "iphone 12")).toBe(false);
  });
});

describe("normalizeImageUrl", () => {
  it("rejects non-http values", () => {
    expect(normalizeImageUrl("foto.jpg")).toBeNull();
    expect(normalizeImageUrl("https://x.com/a.png")).toBe("https://x.com/a.png");
  });
});
