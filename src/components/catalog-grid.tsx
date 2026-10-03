"use client";

import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, Search, SearchX } from "lucide-react";
import type { Product } from "@/lib/types";
import { GENERATIONS } from "@/lib/config";
import { ProductCard } from "./product-card";

type Sort = "recent" | "price-asc" | "price-desc";

export function CatalogGrid({ products }: { products: Product[] }) {
  const [gen, setGen] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("recent");

  const counts = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of products) if (p.generation) m.set(p.generation, (m.get(p.generation) ?? 0) + 1);
    return m;
  }, [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (gen === "all" || p.generation === gen) &&
        (!q || `${p.model} ${p.storage} ${p.condition}`.toLowerCase().includes(q)),
    );
    if (sort === "recent") return list;
    const dir = sort === "price-asc" ? 1 : -1;
    return [...list].sort(
      (a, b) =>
        Number(b.available) - Number(a.available) ||
        dir * ((a.priceUSD ?? Infinity) - (b.priceUSD ?? Infinity)),
    );
  }, [products, gen, query, sort]);

  return (
    <div>
      <div className="sticky top-14 z-30 -mx-4 mb-8 border-b border-white/5 bg-black/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filtrar por generación">
          <FilterChip active={gen === "all"} onClick={() => setGen("all")} count={products.length}>
            Todos
          </FilterChip>
          {GENERATIONS.map((g) => (
            <FilterChip
              key={g}
              active={gen === g}
              onClick={() => setGen(g)}
              count={counts.get(g) ?? 0}
              disabled={!counts.get(g)}
            >
              iPhone {g}
            </FilterChip>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar modelo, ej: 15 Pro Max"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pr-4 pl-9 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
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
              <option value="recent" className="bg-neutral-900">Más nuevos</option>
              <option value="price-asc" className="bg-neutral-900">Menor precio</option>
              <option value="price-desc" className="bg-neutral-900">Mayor precio</option>
            </select>
          </label>
        </div>
      </div>

      {visible.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProductCard key={`${p.id}-${p.model}-${p.storage}`} product={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 py-16 text-center text-white/60">
          <SearchX className="size-8" />
          <p>No encontramos equipos con ese filtro.</p>
          <button
            type="button"
            onClick={() => {
              setGen("all");
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

function FilterChip({
  active,
  disabled,
  count,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
        active
          ? "bg-white text-black"
          : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
      }`}
    >
      {children}
      <span className={`text-xs ${active ? "text-black/50" : "text-white/40"}`}>{count}</span>
    </button>
  );
}
