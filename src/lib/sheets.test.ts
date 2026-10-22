import { describe, expect, it } from "vitest";
import { gridToProducts, gridToTestimonials, hasProductHeader, parseBattery, parseCSV, parseStock, sortProducts } from "./catalog";
import { batteryLevel, modelTier } from "./product";
import { parseSurcharges, simulateInstallments } from "./installments";

const csv = `id,titulo,categoria,almacenamiento,condicion,precio_usd,precio_oferta,bateria,stock,imagen_url,es_oferta
1,iPhone 13,iPhones,128 GB,Usado,450,,90 %,3,,
2,iPhone 15 Pro Max,iPhones,256 GB,Usado,1100,,100,1,,
3,iPhone 11,iPhones,64 GB,Usado,300,,consultar,Disponible,,
4,iPhone 15,iPhones,128 GB,Nuevo,900,850,,0,,
5,iPhone 15 Pro,iPhones,128 GB,Usado,1000,,,Últimas unidades,,
6,Cargador 20W,Accesorios,,Nuevo,25,,,,,si
7,iPhone 16e,iPhones,128 GB,Nuevo,800,,,2,,
8,iPhone 15 Plus,iPhones,128 GB,Usado,950,,85%,,,
9,iPhone 15 Pro,iPhones,256 GB,Usado,1050,,,2,,`;

describe("standard sheet columns", () => {
  const products = gridToProducts(parseCSV(csv), null);
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));

  it("parses numeric and text stock, low stock and sold out", () => {
    expect(byId["1"]).toMatchObject({ quantity: 3, available: true, lowStock: false, stock: "Disponible" });
    expect(byId["2"]).toMatchObject({ quantity: 1, available: true, lowStock: true, stock: "Último en stock" });
    expect(byId["4"]).toMatchObject({ quantity: 0, available: false, stock: "Agotado" });
    expect(byId["5"]).toMatchObject({ available: true, lowStock: true });
    expect(byId["6"]).toMatchObject({ available: true, lowStock: false, isOffer: true });
  });

  it("normalises battery values", () => {
    expect(products.map((p) => p.battery)).toEqual(["90%", "100%", null, null, null, null, null, "85%", null]);
    expect(batteryLevel(byId["1"])).toBe(90);
    expect(parseBattery("0,88")).toBe("88%");
    expect(parseBattery("A consultar")).toBeNull();
    expect(parseBattery("+90% original")).toBe("+90% original");
  });

  it("orders iPhones sequentially by generation and line-up", () => {
    expect(sortProducts(products).map((p) => p.title + (p.storage === "256 GB" ? " 256" : ""))).toEqual([
      "iPhone 16e",
      "iPhone 15 Pro Max 256",
      "iPhone 15 Pro",
      "iPhone 15 Pro 256",
      "iPhone 15 Plus",
      "iPhone 15",
      "iPhone 13",
      "iPhone 11",
      "Cargador 20W",
    ]);
    expect([modelTier("iPhone 13 mini"), modelTier("iPhone 13"), modelTier("iPhone 13 Pro Max")]).toEqual([1, 2, 5]);
  });
});

describe("estado column as availability", () => {
  it("reads Agotado / Disponible from estado when there is no stock column", () => {
    const [a, b] = gridToProducts(
      parseCSV("titulo,precio_usd,estado\niPhone 12,400,Agotado\niPhone 12 Pro,500,Excelente"),
      null,
    );
    expect(a).toMatchObject({ available: false, state: null, stock: "Agotado" });
    expect(b).toMatchObject({ available: true, state: "Excelente" });
  });
  it("parseStock handles units", () => {
    expect(parseStock("1 unidad")).toMatchObject({ quantity: 1, lowStock: true });
    expect(parseStock("Stock limitado")).toMatchObject({ available: true, lowStock: true });
    expect(parseStock("Vendido")).toMatchObject({ available: false, lowStock: false });
  });
});

describe("dedicated Testimonios tab", () => {
  it("parses a tab without product header and yields no products", () => {
    const grid = parseCSV("testimonio,cliente,ciudad,estrellas,captura_url\nTodo impecable,Ana,Esquel,5,");
    expect(hasProductHeader(grid)).toBe(false);
    expect(gridToProducts(grid, null)).toEqual([]);
    expect(gridToTestimonials(grid)).toMatchObject([{ quote: "Todo impecable", name: "Ana", rating: 5 }]);
  });
});

describe("Mercado Pago simulator", () => {
  it("applies configurable surcharges per plan", () => {
    const s = parseSurcharges("3:10, 12:50%");
    expect(s[3]).toBe(10);
    expect(s[12]).toBe(50);
    const q = simulateInstallments(1_000_000, s);
    expect(q.map((x) => x.installments)).toEqual([3, 6, 9, 12]);
    expect(q[0]).toMatchObject({ perInstallment: 366_700, total: 1_100_100 });
    expect(q[3]).toMatchObject({ perInstallment: 125_000, total: 1_500_000 });
  });
});
