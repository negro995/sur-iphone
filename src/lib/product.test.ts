import { describe, expect, it } from "vitest";
import { gridToProducts, parseCSV } from "./catalog";
import { sortByPrice } from "./product";

const csv = `titulo,precio_usd,precio_contado,bateria,stock
iPhone 13,,$500.000,1,Disponible
iPhone 14,700,$900.000,0.88,Disponible
iPhone 12 mini,,,100,Disponible
Cable USB-C,10,,,Disponible`;

describe("review fixes", () => {
  const products = gridToProducts(parseCSV(csv), 1000);
  const byTitle = (t: string) => products.find((p) => p.title === t)!;

  it("falls back to converted cash price when the USD cell is blank", () => {
    expect(byTitle("iPhone 13").priceUSD).toBe(500);
    expect(byTitle("iPhone 14").priceUSD).toBe(700);
  });

  it("only scales decimal battery fractions", () => {
    expect(byTitle("iPhone 13").battery).toBe("1%");
    expect(byTitle("iPhone 14").battery).toBe("88%");
    expect(byTitle("iPhone 12 mini").battery).toBe("100%");
  });

  it("keeps unpriced products last in both sort directions", () => {
    expect(sortByPrice(products, "desc").map((p) => p.title)).toEqual([
      "iPhone 14",
      "iPhone 13",
      "Cable USB-C",
      "iPhone 12 mini",
    ]);
    expect(sortByPrice(products, "asc").at(-1)!.title).toBe("iPhone 12 mini");
  });
});

describe("accessories block below iPhones in the same tab", () => {
  const grid = parseCSV(`,,,,,,,,,,,
,ID / Código,Modelo de iPhone,Almacenamiento (GB),Condición,Batería (%),Costo Base ($),,Precio Contado ($),3 Cuotas: Valor Cuota ($),3 Cuotas: Total ($),Stock / Estado
,1,iPhone 11,64 GB,Usado,N/A,$460.000,,$460.000,$ 200.000,$ 600.000,Disponible
,,,,,,,,,,,
,id,titulo,categoria,precio_usd,precio_oferta,es_oferta,estado,bateria,imagen_url
,ACC-001,Cargador Rápido 20W USB-C,Accesorios,25,20,SI,Nuevo,100%,
,ACC-004,Funda Silicone Case MagSafe,Accesorios,18,15,NO,Nuevo,100%,
,CMB-001,Combo Carga Rápida (Adaptador 20W + Cable),Combos,35,28,SI,Nuevo,100%,`);
  const products = gridToProducts(grid, 1000);
  const byId = (id: string) => products.find((p) => p.id === id)!;

  it("parses both blocks with their own headers", () => {
    expect(products.map((p) => p.id)).toEqual(["1", "ACC-001", "ACC-004", "CMB-001"]);
    expect(byId("1")).toMatchObject({ category: "iPhones", priceUSD: 460 });
    expect(byId("ACC-001")).toMatchObject({ category: "Accesorios", priceUSD: 25, offerPriceUSD: 20, isOffer: true, state: "Nuevo" });
    expect(byId("CMB-001")).toMatchObject({ category: "Combos", priceUSD: 35, offerPriceUSD: 28, isOffer: true });
    expect(new Set(products.map((p) => p.key)).size).toBe(products.length);
  });

  it("respects es_oferta = NO and hides battery on accessories", () => {
    expect(byId("ACC-004")).toMatchObject({ priceUSD: 18, offerPriceUSD: null, isOffer: false });
    expect(byId("ACC-001").battery).toBeNull();
  });
});
