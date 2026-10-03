import { STORE } from "./config";
import type { Product } from "./types";
import { formatUSD } from "./format";

function waLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function productLines(p: Product) {
  return [
    `📱 Modelo: ${p.model}`,
    `💾 Capacidad: ${p.storage}`,
    `🔧 Condición: ${p.condition}`,
    p.battery ? `🔋 Batería: ${p.battery}` : null,
    p.priceUSD != null ? `💵 Precio contado: ${formatUSD(p.priceUSD)}` : null,
  ].filter(Boolean);
}

export function cashPurchaseLink(p: Product) {
  const text = [
    `¡Hola ${STORE.name}! 👋 Quiero comprar este equipo al contado (USD):`,
    "",
    ...productLines(p),
    "",
    "¿Sigue disponible? ¿Cómo coordinamos el pago y la entrega?",
  ].join("\n");
  return waLink(STORE.whatsapp.sales, text);
}

export function financingLink(p?: Product) {
  const text = p
    ? [
        `¡Hola ${STORE.name}! 👋 Quiero consultar financiación / cuotas para:`,
        "",
        ...productLines(p),
        "",
        "¿Qué opciones tienen con tarjeta de crédito (3 cuotas) o Mercado Pago?",
      ].join("\n")
    : `¡Hola ${STORE.name}! 👋 Quiero consultar por financiación y cuotas con tarjeta de crédito o Mercado Pago.`;
  return waLink(STORE.whatsapp.financing, text);
}

export function generalSalesLink() {
  return waLink(
    STORE.whatsapp.sales,
    `¡Hola ${STORE.name}! 👋 Quiero consultar por un iPhone.`,
  );
}
