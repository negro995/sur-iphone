"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowDownWideNarrow, Flame, Search, SearchX } from "lucide-react";
import type { BankDetails, Category, Product } from "@/lib/types";
import { GENERATIONS } from "@/lib/config";
import { CATEGORIES, matchesQuery, sortByPrice } from "@/lib/product";
import { ProductCard } from "./product-card";
import { TransferCheckout } from "./transfer-checkout";

type Sort = "recent" | "price-asc" | "price-desc";
type Tab = "all" | Category | "offers";

export function Storefront({ products, bank }: { products: Product[]; bank: BankDetails }) {
  const [checkout, setCheckout] = useState<Product | null>(null);
  const closeCheckout = useCallback(() => setCheckout(null), []);
  const offers = useMemo(() => products.filter((p) => p.isOffer && p.available), [products]);

  return (
    <>
      {offers.length > 0 && (
        <section id="ofertas" className="scroll-mt-28 border-t border-white/10 bg-gradient-to-b from-amber-500/[0.06] to-transparent">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="mb-6">
              <p className="flex items-center gap-1.5 text-sm font-medium text-amber-300/80">
                <Flame className="size-4" /> Por tiempo limitado
              </p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Ofertas Destacadas</h2>
            </div>
            <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
              {offers.map((p) => (
                <div key={p.key} className="w-[85%] shrink-0 snap-start sm:w-[340px]">
                  <ProductCard product={p} onTransfer={setCheckout} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="catalogo" className="scroll-mt-28 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-white/50">Stock actualizado</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Catálogo</h2>
            </div>
            <p className="text-sm text-white/50">Precios en USD · pago único contado / transferencia</p>
          </div>
          <CatalogGrid products={products} offersCount={offers.length} onTransfer={setCheckout} />
        </div>
      </section>

      {checkout && <TransferCheckout product={checkout} bank={bank} onClose={closeCheckout} />}
    </>
  );
}

function CatalogGrid({
  products,
  offersCount,
  onTransfer,
}: {
  products: Product[];
  offersCount: number;
  onTransfer: (p: Product) => void;
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [gen, setGen] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("recent");

  const catCounts = useMemo(() => {
    const m = new Map<Category, number>();
    for (const p of products) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return m;
  }, [products]);

  const genCounts = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of products) if (p.generation) m.set(p.generation, (m.get(p.generation) ?? 0) + 1);
    return m;
  }, [products]);

  const showGenerations = (tab === "all" || tab === "iPhones") && genCounts.size > 0;

  const visible = useMemo(() => {
    const list = products.filter(
      (p) =>
        (tab === "all" || (tab === "offers" ? p.isOffer : p.category === tab)) &&
        (!showGenerations || gen === "all" || p.generation === gen) &&
        matchesQuery(p, query),
    );
    if (sort === "recent") return list;
    return sortByPrice(list, sort === "price-asc" ? "asc" : "desc");
  }, [products, tab, gen, query, sort, showGenerations]);

  const selectTab = (t: Tab) => {
    setTab(t);
    setGen("all");
  };

  return (
    <div>
      <div className="z-30 sm:sticky sm:top-14 -mx-4 mb-8 border-b border-white/5 bg-black/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Categorías">
          <div className="flex shrink-0 gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            <CategoryTab active={tab === "all"} onClick={() => selectTab("all")} count={products.length}>
              Todos
            </CategoryTab>
            {CATEGORIES.map((c) => (
              <CategoryTab key={c} active={tab === c} onClick={() => selectTab(c)} count={catCounts.get(c) ?? 0}>
                {c}
              </CategoryTab>
            ))}
          </div>
          {offersCount > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={tab === "offers"}
              onClick={() => selectTab("offers")}
              className={`ml-1 flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                tab === "offers"
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black"
                  : "border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20"
              }`}
            >
              <Flame className="size-4" /> Ofertas
            </button>
          )}
        </div>

        {showGenerations && (
          <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1" aria-label="Filtrar por generación">
            <FilterChip active={gen === "all"} onClick={() => setGen("all")}>
              Todas
            </FilterChip>
            {GENERATIONS.map((g) => (
              <FilterChip key={g} active={gen === g} onClick={() => setGen(g)} disabled={!genCounts.get(g)} count={genCounts.get(g) ?? 0}>
                iPhone {g}
              </FilterChip>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Buscar: "iPhone 13 128gb" o "Cargador 20W"'
              aria-label="Buscar productos"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pr-4 pl-9 text-base text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none sm:text-sm"
            />
          </label>
          <label className="relative">
            <ArrowDownWideNarrow className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Ordenar"
              className="h-full appearance-none rounded-full border border-white/10 bg-white/5 py-2.5 pr-4 pl-9 text-sm text-white focus:border-white/30 focus:outline-none"
            >
              <option value="recent" className="bg-neutral-900">Destacados</option>
              <option value="price-asc" className="bg-neutral-900">Menor precio</option>
              <option value="price-desc" className="bg-neutral-900">Mayor precio</option>
            </select>
          </label>
        </div>
      </div>

      {visible.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProductCard key={p.key} product={p} onTransfer={onTransfer} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 py-16 text-center text-white/60">
          <SearchX className="size-8" />
          <p>
            {tab !== "all" && tab !== "offers" && !catCounts.get(tab)
              ? `Pronto vas a encontrar ${tab.toLowerCase()} acá. Consultanos por WhatsApp.`
              : "No encontramos productos con ese filtro."}
          </p>
          <button
            type="button"
            onClick={() => {
              selectTab("all");
              setQuery("");
            }}
            className="text-sm text-white underline underline-offset-4"
          >
            Ver todo el catálogo
          </button>
        </div>
      )}
    </div>
  );
}

function CategoryTab({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
        active ? "bg-white text-black" : "text-white/70 hover:text-white"
      }`}
    >
      {children}
      <span className={`text-xs ${active ? "text-black/50" : "text-white/40"}`}>{count}</span>
    </button>
  );
}

function FilterChip({
  active,
  disabled,
  count,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition ${
        active
          ? "bg-white/90 text-black"
          : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
      }`}
    >
      {children}
      {count != null && <span className={active ? "text-black/50" : "text-white/40"}>{count}</span>}
    </button>
  );
}
