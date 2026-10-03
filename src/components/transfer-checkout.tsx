"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Landmark, Receipt, X } from "lucide-react";
import type { BankDetails, Product } from "@/lib/types";
import { formatUSD } from "@/lib/format";
import { finalPrice } from "@/lib/product";
import { bankDetailsRequestLink, newOrderNumber, transferReceiptLink } from "@/lib/whatsapp";
import { ProductImage } from "./product-media";
import { WhatsAppIcon } from "./brand-icons";

export function TransferCheckout({
  product: p,
  bank,
  onClose,
}: {
  product: Product;
  bank: BankDetails;
  onClose: () => void;
}) {
  const [orderNumber] = useState(() => newOrderNumber());
  const price = finalPrice(p);
  const hasBank = Boolean(bank.cbu || bank.alias);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const rows: [string, string | null][] = [
    ["CBU / CVU", bank.cbu],
    ["Alias", bank.alias],
    ["Titular", bank.holder],
    ["CUIT", bank.cuit],
    ["Banco", bank.bank],
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="transfer-title">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-neutral-950 p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium tracking-wider text-white/50 uppercase">
              <Landmark className="size-3.5" /> Checkout
            </p>
            <h2 id="transfer-title" className="mt-1 text-xl font-semibold tracking-tight">
              Pago por Transferencia / Depósito Bancario
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-9 shrink-0 place-items-center rounded-full bg-white/5 hover:bg-white/10">
            <X className="size-5" />
          </button>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span className="flex items-center gap-1.5"><Receipt className="size-3.5" /> Resumen del pedido</span>
            <span className="font-mono text-white/80">N° {orderNumber}</span>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex h-20 w-16 shrink-0 items-center justify-center">
              <ProductImage product={p} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm text-white/50">
                {[p.storage, p.state ?? p.condition, p.battery && `Batería ${p.battery}`].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-3">
            <span className="text-sm text-white/60">Total</span>
            <span className="text-2xl font-semibold">{price != null ? formatUSD(price) : "A confirmar"}</span>
          </div>
          <p className="mt-1 text-right text-xs text-white/40">
            Podés pagar en USD o en ARS. Si transferís en pesos, te confirmamos el monto por WhatsApp.
          </p>
        </section>

        <section className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-white/80">1. Transferí a esta cuenta</h3>
          {hasBank ? (
            <dl className="divide-y divide-white/10 rounded-2xl border border-white/10">
              {rows
                .filter((r): r is [string, string] => Boolean(r[1]))
                .map(([label, value]) => (
                  <CopyRow key={label} label={label} value={value} />
                ))}
            </dl>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
              Pedinos los datos bancarios por WhatsApp y te los enviamos al instante.
              <a
                href={bankDetailsRequestLink(p, orderNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 font-medium text-white hover:bg-white/5"
              >
                <WhatsAppIcon className="size-4" /> Pedir datos bancarios
              </a>
            </div>
          )}
        </section>

        <section className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-white/80">2. Envianos el comprobante</h3>
          <a
            href={transferReceiptLink(p, orderNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3.5 text-sm font-semibold text-black transition hover:brightness-110 active:scale-[0.98]"
          >
            <WhatsAppIcon className="size-5" /> Enviar comprobante por WhatsApp
          </a>
          <p className="mt-2 text-center text-xs text-white/40">
            Se abre WhatsApp con tu N° de pedido y el detalle del producto. Adjuntá la foto o PDF del comprobante.
          </p>
        </section>
      </div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <dt className="text-xs text-white/50">{label}</dt>
        <dd className="truncate font-mono text-sm">{value}</dd>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {}
        }}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
        aria-label={`Copiar ${label}`}
      >
        {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
