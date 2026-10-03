"use client";

import { BatteryFull, BatteryMedium, CreditCard, Flame, HardDrive, Landmark, ShieldCheck, Sparkles } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatUSD } from "@/lib/format";
import { discountPercent, finalPrice } from "@/lib/product";
import { cashPurchaseLink, financingLink } from "@/lib/whatsapp";
import { ProductImage } from "./product-media";
import { WhatsAppIcon } from "./brand-icons";

export function ProductCard({
  product: p,
  onTransfer,
}: {
  product: Product;
  onTransfer: (p: Product) => void;
}) {
  const price = finalPrice(p);
  const off = discountPercent(p);
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-gradient-to-b from-white/[0.07] to-white/[0.02] transition hover:border-white/20 ${p.isOffer ? "border-amber-400/30" : "border-white/10"} ${p.available ? "" : "opacity-60"}`}
    >
      <div className="relative flex h-52 items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_70%)] px-10 pt-8 pb-3">
        <div className="flex h-full w-full items-center justify-center transition duration-500 group-hover:-translate-y-1 group-hover:scale-[1.03]">
          <ProductImage product={p} />
        </div>
        <span
          className={`absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur ${p.available ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}
        >
          <span className={`size-1.5 rounded-full ${p.available ? "bg-emerald-400" : "bg-red-400"}`} />
          {p.stock}
        </span>
        {p.isOffer && (
          <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-xs font-bold text-black shadow-lg shadow-orange-500/30">
            <Flame className="size-3.5" />
            {off ? `-${off}%` : "Oferta"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="text-xs font-medium tracking-wider text-white/40 uppercase">{p.category}</p>
          <h3 className="mt-0.5 text-xl font-semibold tracking-tight">{p.title}</h3>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {p.storage && <Chip icon={<HardDrive className="size-3.5" />}>{p.storage}</Chip>}
            {p.state && (
              <Chip icon={<Sparkles className="size-3.5 text-sky-300" />} tone="sky">
                {p.state}
              </Chip>
            )}
            {p.condition && <Chip icon={<ShieldCheck className="size-3.5" />}>{p.condition}</Chip>}
            {p.battery ? (
              <Chip icon={<BatteryFull className="size-3.5 text-emerald-400" />} tone="emerald">
                Batería {p.battery}
              </Chip>
            ) : (
              p.category === "iPhones" && <Chip icon={<BatteryMedium className="size-3.5" />}>Batería: consultar</Chip>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-xs tracking-wider text-white/50 uppercase">Contado / transferencia</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-semibold tracking-tight ${p.offerPriceUSD != null ? "text-amber-300" : ""}`}>
              {price != null ? formatUSD(price) : "Consultar"}
            </p>
            {p.offerPriceUSD != null && p.priceUSD != null && (
              <p className="text-sm text-white/40 line-through">{formatUSD(p.priceUSD)}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {p.available ? (
            <>
              <a
                href={cashPurchaseLink(p)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]"
              >
                <WhatsAppIcon className="size-4" />
                Comprar Contado (USD)
              </a>
              <button
                type="button"
                onClick={() => onTransfer(p)}
                className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-[0.98]"
              >
                <Landmark className="size-4" />
                Pagar por Transferencia
              </button>
            </>
          ) : (
            <span className="flex items-center justify-center rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white/50">
              Sin stock
            </span>
          )}
          <a
            href={financingLink(p)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/5 active:scale-[0.98]"
          >
            <CreditCard className="size-4" />
            Consultar Financiación / Cuotas
          </a>
        </div>
      </div>
    </article>
  );
}

const TONES = {
  default: "border-white/10 bg-white/5 text-white/70",
  emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  sky: "border-sky-400/30 bg-sky-400/10 text-sky-200",
};

function Chip({
  icon,
  children,
  tone = "default",
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${TONES[tone]}`}>
      {icon}
      {children}
    </span>
  );
}
