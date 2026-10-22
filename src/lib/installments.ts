/** Mercado Pago installment plans offered in the simulator. */
export const INSTALLMENT_PLANS = [3, 6, 9, 12] as const;

/** Total surcharge (%) per plan. Estimated defaults; override with `MP_CUOTAS_RECARGO`. */
export const DEFAULT_SURCHARGES: Record<number, number> = { 3: 20, 6: 35, 9: 50, 12: 65 };

export type Surcharges = Record<number, number>;

export type InstallmentQuote = {
  installments: number;
  surchargePct: number;
  total: number;
  perInstallment: number;
};

/** Parses "3:20,6:35,9:50,12:65" (percent over the cash price) on top of the defaults. */
export function parseSurcharges(raw: string | undefined): Surcharges {
  const out: Surcharges = { ...DEFAULT_SURCHARGES };
  for (const part of (raw ?? "").split(",")) {
    const m = part.trim().match(/^(\d+)\s*[:=]\s*(\d+(?:[.,]\d+)?)\s*%?$/);
    if (m && (INSTALLMENT_PLANS as readonly number[]).includes(Number(m[1]))) {
      out[Number(m[1])] = Number(m[2].replace(",", "."));
    }
  }
  return out;
}

/** Estimated Mercado Pago quotes for a cash price in ARS, rounded up to $100 per installment. */
export function simulateInstallments(priceARS: number, surcharges: Surcharges): InstallmentQuote[] {
  return INSTALLMENT_PLANS.map((n) => {
    const surchargePct = surcharges[n] ?? DEFAULT_SURCHARGES[n];
    const perInstallment = Math.ceil((priceARS * (1 + surchargePct / 100)) / n / 100) * 100;
    return { installments: n, surchargePct, perInstallment, total: perInstallment * n };
  });
}
