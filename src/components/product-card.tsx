import { BatteryFull, BatteryMedium, CreditCard, HardDrive, ShieldCheck } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatUSD } from "@/lib/format";
import { cashPurchaseLink, financingLink } from "@/lib/whatsapp";
import { PhoneArt } from "./phone-art";
import { WhatsAppIcon } from "./brand-icons";

export function ProductCard({ product: p }: { product: Product }) {
  const pro = /pro/i.test(p.model);
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] transition hover:border-white/20 ${p.available ? "" : "opacity-60"}`}
    >
      <div className="relative flex h-52 items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_70%)] pt-6 pb-2">
        <div className="h-full transition duration-500 group-hover:-translate-y-1 group-hover:scale-[1.03]">
          <PhoneArt generation={p.generation} pro={pro} />
        </div>
        <span
          className={`absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${p.available ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}
        >
          <span className={`size-1.5 rounded-full ${p.available ? "bg-emerald-400" : "bg-red-400"}`} />
          {p.stock}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{p.model}</h3>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Chip icon={<HardDrive className="size-3.5" />}>{p.storage}</Chip>
            <Chip icon={<ShieldCheck className="size-3.5" />}>{p.condition}</Chip>
            {p.battery ? (
              <Chip icon={<BatteryFull className="size-3.5 text-emerald-400" />} highlight>
                Batería {p.battery}
              </Chip>
            ) : (
              <Chip icon={<BatteryMedium className="size-3.5" />}>Batería: consultar</Chip>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-xs uppercase tracking-wider text-white/50">Contado / transferencia</p>
          <p className="text-3xl font-semibold tracking-tight">
            {p.priceUSD != null ? formatUSD(p.priceUSD) : "Consultar"}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {p.available ? (
            <a
              href={cashPurchaseLink(p)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]"
            >
              <WhatsAppIcon className="size-4" />
              Comprar Contado (USD)
            </a>
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

function Chip({
  icon,
  children,
  highlight,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${highlight ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/5 text-white/70"}`}
    >
      {icon}
      {children}
    </span>
  );
}
