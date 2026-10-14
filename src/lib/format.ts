export function formatUSD(value: number) {
  return `USD ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(value)}`;
}

/** ARS estimate rounded to the nearest $1.000. */
export function formatARS(value: number) {
  return `$ ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(value / 1000) * 1000)}`;
}
