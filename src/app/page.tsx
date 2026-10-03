import { AlertTriangle } from "lucide-react";
import { getCatalog } from "@/lib/catalog";
import { getBankDetails } from "@/lib/bank";
import { finalPrice } from "@/lib/product";
import { Header } from "@/components/header";
import { Storefront } from "@/components/storefront";
import { FloatingWhatsApp, Financing, Footer, Hero, HowToBuy, TrustBanner } from "@/components/sections";

export const revalidate = 60;

export default async function Home() {
  const catalog = await getCatalog();
  const inStock = catalog.products.filter((p) => p.available);
  const phonePrices = inStock
    .filter((p) => p.category === "iPhones")
    .map(finalPrice)
    .filter((n): n is number => n != null);
  const fromUSD = phonePrices.length ? Math.min(...phonePrices) : null;

  return (
    <>
      <Header />
      <TrustBanner />
      <main className="flex-1">
        <Hero count={inStock.length} fromUSD={fromUSD} />

        {catalog.error ? (
          <section id="catalogo" className="scroll-mt-14 border-t border-white/10">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
              <div className="flex items-start gap-3 rounded-3xl border border-amber-400/30 bg-amber-400/10 p-6 text-amber-100">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-semibold">No pudimos cargar el catálogo en este momento.</p>
                  <p className="text-sm text-amber-100/70">
                    Escribinos por WhatsApp y te pasamos el stock actualizado.
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <Storefront products={catalog.products} bank={getBankDetails()} />
        )}

        <Financing />
        <HowToBuy />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
