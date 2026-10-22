"use client";

import { BatteryWarning, CreditCard, Flame, HardDrive, Landmark, ShieldCheck, Sparkles } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatARS, formatUSD } from "@/lib/format";
import { trackAttrs } from "@/lib/analytics";
import type { Surcharges } from "@/lib/installments";
import { batteryLevel, discountPercent, finalPrice } from "@/lib/product";
import { batteryQuestionLink, cashPurchaseLink, financingLink } from "@/lib/whatsapp";
import { ProductImage } from "./product-media";
import { WhatsAppIcon } from "./brand-icons";
import { InstallmentSimulator } from "./installment-simulator";

export function ProductCard({
  product: p,
  onTransfer,
  arsRate = null,
  quoteRate = null,
  surcharges,
}: {
  product: Product;
  onTransfer: (p: Product) => void;
  /** Set when the visitor chose "USD + ARS": shows the peso estimate under the price. */
  arsRate?: number | null;
  /** Store's current ARS/USD rate, used by the installment simulator. */
  quoteRate?: number | null;
  surcharges?: Surcharges;
}) {
  const price = finalPrice(p);
  const off = discountPercent(p);
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-gradient-to-b from-white/[0.07] to-white/[0.02] transition hover:border-white/20 ${p.isOffer ? "border-amber-400/30" : "border-white/10"} ${p.available ? "" : "opacity-60"}`}
    >
      <div className="relative m-2 aspect-[3/2] rounded-[1.25rem] bg-[#D1D1D6]">
        <div className="absolute inset-x-4 top-7 bottom-4 flex items-center justify-center transition duration-500 group-hover:-translate-y-1 group-hover:scale-[1.03]">
          <ProductImage product={p} />
        </div>
        {p.available && p.lowStock ? (
          <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg shadow-rose-500/30">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-white" />
            </span>
            ¡Último en stock!
          </span>
        ) : (
          <span
            className={`absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur ${p.available ? "bg-white/90 text-emerald-700" : "bg-white/90 text-red-600"}`}
          >
            <span className={`size-1.5 rounded-full ${p.available ? "bg-emerald-500" : "bg-red-500"}`} />
            {p.stock}
          </span>
        )}
        {(p.category === "iPhones" || p.battery) && <BatteryBadge product={p} />}
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
          {arsRate && price != null && (
            <p className="mt-0.5 text-sm text-white/60">
              ≈ <span className="font-semibold text-white/85">{formatARS(price * arsRate)}</span> ARS{" "}
              <span className="text-white/40">estimado</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {p.available ? (
            <>
              <a
                href={cashPurchaseLink(p)}
                target="_blank"
                rel="noopener noreferrer"
                {...trackAttrs("contado", p.title, price)}
                className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]"
              >
                <WhatsAppIcon className="size-4" />
                Comprar Contado (USD)
              </a>
              <button
                type="button"
                onClick={() => onTransfer(p)}
                {...trackAttrs("transferencia", p.title, price)}
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
          {quoteRate && price != null && (
            <InstallmentSimulator product={p} priceARS={price * quoteRate} surcharges={surcharges} />
          )}
          <a
            href={financingLink(p)}
            target="_blank"
            rel="noopener noreferrer"
            {...trackAttrs("financiacion", p.title, price)}
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

/** Battery health over the photo: % with a colour bar, or a "consultá" link when the sheet leaves it empty. */
function BatteryBadge({ product: p }: { product: Product }) {
  const level = batteryLevel(p);
  const base = "absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur";
  if (level != null) {
    const tone = level >= 90 ? "bg-emerald-500" : level >= 80 ? "bg-lime-500" : "bg-amber-500";
    const text = level >= 90 ? "text-emerald-700" : level >= 80 ? "text-lime-700" : "text-amber-700";
    return (
      <span className={`${base} bg-white/90 ${text}`} aria-label={`Batería ${level}%`}>
        <span className="relative flex h-2.5 w-5 items-center rounded-[3px] border border-current p-[1px] after:absolute after:-right-[3px] after:h-1 after:w-[2px] after:rounded-r-sm after:bg-current">
          <span className={`h-full rounded-[1px] ${tone}`} style={{ width: `${Math.max(level, 8)}%` }} />
        </span>
        Batería {level}%
      </span>
    );
  }
  if (p.battery) {
    return <span className={`${base} bg-white/90 text-emerald-700`}>Batería {p.battery}</span>;
  }
  return (
    <a
      href={batteryQuestionLink(p)}
      target="_blank"
      rel="noopener noreferrer"
      {...trackAttrs("consulta", p.title)}
      className={`${base} border border-dashed border-amber-500/70 bg-amber-50/90 text-amber-800 transition hover:bg-amber-100`}
    >
      <BatteryWarning className="size-3.5" />
      Batería: ¡consultanos!
    </a>
  );
}
