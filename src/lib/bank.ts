import type { BankDetails } from "./types";

const val = (v: string | undefined) => v?.trim() || null;

export function getBankDetails(): BankDetails {
  return {
    cbu: val(process.env.BANK_CBU),
    alias: val(process.env.BANK_ALIAS),
    holder: val(process.env.BANK_HOLDER),
    bank: val(process.env.BANK_NAME),
    cuit: val(process.env.BANK_CUIT),
  };
}

export function hasBankDetails(b: BankDetails) {
  return Boolean(b.cbu || b.alias);
}
