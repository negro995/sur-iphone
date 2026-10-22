"use client";

import { useId, useMemo, useState } from "react";
import { Calculator, ChevronDown } from "lucide-react";
import type { Product } from "@/lib/types";
import { track, trackAttrs } from "@/lib/analytics";
import { formatPesos } from "@/lib/format";
import { DEFAULT_SURCHARGES, type Surcharges, simulateInstallments } from "@/lib/installments";
import { financingLink } from "@/lib/whatsapp";
import { finalPrice } from "@/lib/product";

/** Collapsible Mercado Pago simulator (3, 6, 9 and 12 installments) based on the store's dollar rate. */
export function InstallmentSimulator({
  product: p,
  priceARS,
  surcharges = DEFAULT_SURCHARGES,
}: {
  product: Product;
  priceARS: number;
  surcharges?: Surcharges;
}) {
  const [open, setOpen] = useState(false);
  const quotes = useMemo(() => simulateInstallments(priceARS, surcharges), [priceARS, surcharges]);
  const [selected, setSelected] = useState(quotes[quotes.length - 1].installments);
  const plan = quotes.find((q) => q.installments === selected) ?? quotes[0];
  const panelId = useId();

  return (
    <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.06]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (!open) track("installments_simulator_open", { product: p.title });
          setOpen(!open);
        }}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-sky-100"
      >
        <span className="flex items-center gap-2">
          <Calculator className="size-4 text-sky-300" />
          {open ? "Cuotas con Mercado Pago" : `Hasta 12 cuotas de ${formatPesos(quotes[quotes.length - 1].perInstallment)}`}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-sky-300 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div id={panelId} className="border-t border-sky-400/15 px-4 pt-3 pb-4">
          <div className="grid grid-cols-4 gap-1 rounded-full bg-black/30 p-1" role="radiogroup" aria-label="Cantidad de cuotas">
            {quotes.map((q) => (
              <button
                key={q.installments}
                type="button"
                role="radio"
                aria-checked={q.installments === selected}
                onClick={() => {
                  setSelected(q.installments);
                  track("installments_simulator_select", { product: p.title, installments: q.installments });
                }}
                className={`rounded-full py-1.5 text-xs font-semibold transition ${q.installments === selected ? "bg-sky-400 text-black" : "text-white/70 hover:text-white"}`}
              >
                {q.installments}
              </button>
            ))}
          </div>

          <p className="mt-3 text-center text-sm text-white/60">
            <span className="text-2xl font-semibold tracking-tight text-white">{plan.installments}</span> cuotas de{" "}
            <span className="text-2xl font-semibold tracking-tight text-white">{formatPesos(plan.perInstallment)}</span>
          </p>
          <p className="text-center text-xs text-white/50">
            Total {formatPesos(plan.total)} · recargo estimado {plan.surchargePct}%
          </p>

          <table className="mt-3 w-full text-xs">
            <thead className="text-white/40">
              <tr>
                <th className="py-1 text-left font-medium">Cuotas</th>
                <th className="py-1 text-right font-medium">Valor cuota</th>
                <th className="py-1 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.installments} className={`border-t border-white/5 ${q.installments === selected ? "text-sky-200" : "text-white/70"}`}>
                  <td className="py-1">{q.installments} cuotas</td>
                  <td className="py-1 text-right font-semibold">{formatPesos(q.perInstallment)}</td>
                  <td className="py-1 text-right">{formatPesos(q.total)}</td>
                </tr>
              ))}
              <tr className="border-t border-white/5 text-white/50">
                <td className="py-1">Contado</td>
                <td className="py-1 text-right" colSpan={2}>{formatPesos(priceARS)}</td>
              </tr>
            </tbody>
          </table>

          <a
            href={financingLink(p, plan)}
            target="_blank"
            rel="noopener noreferrer"
            {...trackAttrs("financiacion", p.title, finalPrice(p))}
            className="mt-3 flex items-center justify-center rounded-full bg-sky-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-sky-300 active:scale-[0.98]"
          >
            Pedir link de pago en {plan.installments} cuotas
          </a>
          <p className="mt-2 text-[11px] leading-snug text-white/40">
            Estimado según la cotización del dólar de la tienda. El valor final de cada cuota lo confirma Mercado Pago al pagar.
          </p>
        </div>
      )}
    </div>
  );
}
