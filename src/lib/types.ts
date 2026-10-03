export type Category = "iPhones" | "Accesorios" | "Combos";

export type Product = {
  key: string;
  id: string;
  title: string;
  category: Category;
  generation: number | null;
  storage: string | null;
  condition: string | null;
  state: string | null;
  battery: string | null;
  priceUSD: number | null;
  offerPriceUSD: number | null;
  isOffer: boolean;
  imageUrl: string | null;
  stock: string;
  available: boolean;
};

export type Catalog = {
  products: Product[];
  updatedAt: string;
  source: "sheets-api" | "csv" | "error";
  error?: string;
};

export type BankDetails = {
  cbu: string | null;
  alias: string | null;
  holder: string | null;
  bank: string | null;
  cuit: string | null;
};
