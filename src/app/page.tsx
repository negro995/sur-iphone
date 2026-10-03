import { AlertTriangle } from "lucide-react";
import { getCatalog } from "@/lib/catalog";
import { Header } from "@/components/header";
import { CatalogGrid } from "@/components/catalog-grid";
import { FloatingWhatsApp, Financing, Footer, Hero, HowToBuy } from "@/components/sections";

export const revalidate = 60;

export default async function Home() {
  const catalog = await getCatalog();
  const inStock = catalog.products.filter((p) => p.available);
  const prices = inStock.map((p) => p.priceUSD).filter((n): n is number => n != null);
  const fromUSD = prices.length ? Math.min(...prices) : null;

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero count={inStock.length} fromUSD={fromUSD} />

        <section id="catalogo" className="scroll-mt-14 border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-white/50">Stock actualizado</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Catálogo</h2>
              </div>
              <p className="text-sm text-white/50">
                Precios en USD · pago único contado / transferencia
              </p>
            </div>

            {catalog.error ? (
              <div className="flex items-start gap-3 rounded-3xl border border-amber-400/30 bg-amber-400/10 p-6 text-amber-100">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-semibold">No pudimos cargar el catálogo en este momento.</p>
                  <p className="text-sm text-amber-100/70">
                    Escribinos por WhatsApp y te pasamos el stock actualizado.
                  </p>
                </div>
              </div>
            ) : (
              <CatalogGrid products={catalog.products} />
            )}
          </div>
        </section>

        <Financing />
        <HowToBuy />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
