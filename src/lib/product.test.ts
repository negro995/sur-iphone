import { describe, expect, it } from "vitest";
import { gridToProducts, parseCSV } from "./catalog";
import { sortByPrice } from "./product";

const csv = `titulo,precio_usd,precio_contado,bateria,stock
iPhone 13,,$500.000,1,Disponible
iPhone 14,700,$900.000,0.88,Disponible
Funda MagSafe,,,100,Disponible
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
    expect(byTitle("Funda MagSafe").battery).toBe("100%");
  });

  it("keeps unpriced products last in both sort directions", () => {
    expect(sortByPrice(products, "desc").map((p) => p.title)).toEqual([
      "iPhone 14",
      "iPhone 13",
      "Cable USB-C",
      "Funda MagSafe",
    ]);
    expect(sortByPrice(products, "asc").at(-1)!.title).toBe("Funda MagSafe");
  });
});
