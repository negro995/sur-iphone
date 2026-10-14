import { describe, expect, it } from "vitest";
import { gridToProducts, gridToTestimonials, parseCSV } from "./catalog";
import { conditionGroup, storageGB, storageLabel } from "./product";
import { formatARS } from "./format";

const grid = parseCSV(`,id,titulo,categoria,almacenamiento,condicion,precio_usd,estado
,1,iPhone 13 Pro,iPhones,256 GB,Usado,700,
,2,iPhone 16,iPhones,128GB,,900,Nuevo sellado
,3,iPhone 15 Pro Max 1TB,iPhones,,Reacondicionado A+,1200,
,ACC-1,Cable USB-C,Accesorios,,,10,Nuevo
,,,,,,,
,testimonio,cliente,ciudad,captura_url,estrellas
,"Excelente atención, el equipo impecable",Juan P.,Esquel,https://drive.google.com/file/d/abc123/view,5
,Muy recomendables,,Trevelin,,⭐⭐⭐⭐
,,,,,`);

describe("landing features", () => {
  const products = gridToProducts(grid, 1000);

  it("keeps testimonial rows out of the product list", () => {
    expect(products.map((p) => p.id)).toEqual(["1", "2", "3", "ACC-1"]);
  });

  it("parses testimonials with Drive screenshots and star ratings", () => {
    const t = gridToTestimonials(grid);
    expect(t).toHaveLength(2);
    expect(t[0]).toMatchObject({
      quote: "Excelente atención, el equipo impecable",
      name: "Juan P.",
      location: "Esquel",
      imageUrl: "https://lh3.googleusercontent.com/d/abc123=w800",
      rating: 5,
    });
    expect(t[1]).toMatchObject({ name: null, location: "Trevelin", rating: 4, imageUrl: null });
  });

  it("derives storage and condition filters", () => {
    expect(products.map(storageGB)).toEqual([256, 128, 1024, null]);
    expect(storageLabel(1024)).toBe("1 TB");
    expect(products.map(conditionGroup)).toEqual(["Usado", "Nuevo", "Usado", "Nuevo"]);
  });

  it("formats the ARS estimate rounded to $1.000", () => {
    expect(formatARS(700 * 1555)).toBe("$ 1.089.000");
  });
});
