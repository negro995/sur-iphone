export function formatUSD(value: number) {
  return `USD ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(value)}`;
}
