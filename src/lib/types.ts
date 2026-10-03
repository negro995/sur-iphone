export type Product = {
  id: string;
  model: string;
  generation: number | null;
  storage: string;
  condition: string;
  battery: string | null;
  priceUSD: number | null;
  stock: string;
  available: boolean;
};

export type Catalog = {
  products: Product[];
  updatedAt: string;
  source: "sheets-api" | "csv" | "error";
  error?: string;
};
