import { STORE } from "./config";
import type { Product } from "./types";
import { formatUSD } from "./format";
import { finalPrice } from "./product";

function waLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function productLines(p: Product) {
  const price = finalPrice(p);
  return [
    `${p.category === "iPhones" ? "📱" : p.category === "Combos" ? "🎁" : "🔌"} Producto: ${p.title}`,
    p.storage ? `💾 Capacidad: ${p.storage}` : null,
    p.condition ? `🔧 Condición: ${p.condition}` : null,
    p.state ? `✨ Estado: ${p.state}` : null,
    p.battery ? `🔋 Batería: ${p.battery}` : null,
    price != null ? `💵 Precio${p.offerPriceUSD != null ? " oferta" : ""}: ${formatUSD(price)}` : null,
  ].filter(Boolean);
}

export function cashPurchaseLink(p: Product) {
  const text = [
    `¡Hola ${STORE.name}! 👋 Quiero comprar este producto al contado (USD):`,
    "",
    ...productLines(p),
    "",
    "¿Sigue disponible? ¿Cómo coordinamos el pago y la entrega?",
  ].join("\n");
  return waLink(STORE.whatsapp.sales, text);
}

export function transferReceiptLink(p: Product, orderNumber: string) {
  const text = [
    `¡Hola ${STORE.name}! 👋 Hice un pedido para pagar por *transferencia / depósito bancario*.`,
    "",
    `🧾 Pedido N°: ${orderNumber}`,
    ...productLines(p),
    "",
    "Te envío el comprobante de la transferencia por acá. ¡Gracias!",
  ].join("\n");
  return waLink(STORE.whatsapp.sales, text);
}

export function bankDetailsRequestLink(p: Product, orderNumber: string) {
  const text = [
    `¡Hola ${STORE.name}! 👋 Quiero pagar por transferencia / depósito bancario. ¿Me pasan los datos bancarios?`,
    "",
    `🧾 Pedido N°: ${orderNumber}`,
    ...productLines(p),
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
  return waLink(STORE.whatsapp.sales, `¡Hola ${STORE.name}! 👋 Quiero consultar por stock y precios.`);
}

export function newOrderNumber(now = new Date()) {
  const ymd = `${now.getFullYear() % 100}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "0");
  return `SUR-${ymd}-${rand}`;
}
