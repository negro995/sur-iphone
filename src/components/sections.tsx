import {
  Banknote,
  CreditCard,
  MapPin,
  MessageCircle,
  RefreshCw,
  Smartphone,
  Wallet,
  Handshake,
  ShieldCheck,
  Truck,
  Landmark,
} from "lucide-react";
import { STORE, formatPhone } from "@/lib/config";
import { financingLink, generalSalesLink } from "@/lib/whatsapp";
import { InstagramIcon, WhatsAppIcon } from "./brand-icons";

const TRUST = [
  { icon: ShieldCheck, title: "Garantía escrita", desc: "Comprá con respaldo" },
  { icon: Truck, title: "Envíos o retiros", desc: "Coordinados por WhatsApp" },
  { icon: Landmark, title: "USD o ARS", desc: "Pagos por transferencia" },
];

export function TrustBanner() {
  return (
    <section aria-label="Por qué comprar en Sur IPhone" className="border-b border-white/10 bg-white/[0.03]">
      <ul className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-white/10 px-2 py-3 sm:px-6">
        {TRUST.map(({ icon: Icon, title, desc }) => (
          <li key={title} className="flex flex-col items-center gap-1 px-2 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
            <Icon className="size-5 shrink-0 text-emerald-300" />
            <div>
              <p className="text-xs font-semibold sm:text-sm">{title}</p>
              <p className="hidden text-xs text-white/50 sm:block">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Hero({ count, fromUSD }: { count: number; fromUSD: number | null }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,119,198,0.25),transparent)]" />
      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-14 text-center sm:px-6 sm:pt-24 sm:pb-20">
        <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
          <MapPin className="size-3.5" /> {STORE.location} · Atención por WhatsApp
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Tu próximo iPhone,{" "}
          <span className="bg-gradient-to-r from-white via-white/80 to-white/50 bg-clip-text text-transparent">
            al mejor precio del Sur.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-white/60 text-pretty sm:text-lg">
          Del iPhone 11 al iPhone 17, accesorios y combos. Precios en dólares contado, stock
          actualizado en tiempo real y financiación en cuotas.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#catalogo"
            className="w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90 sm:w-auto"
          >
            Ver catálogo{fromUSD != null ? ` · desde USD ${fromUSD}` : ""}
          </a>
          <a
            href={STORE.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium transition hover:bg-white/5 sm:w-auto"
          >
            <InstagramIcon className="size-4" /> Seguinos en {STORE.instagram.handle}
          </a>
        </div>
        <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Smartphone, k: `${count || "—"}`, v: "productos en stock" },
            { icon: Banknote, k: "USD", v: "precio contado" },
            { icon: CreditCard, k: "3 cuotas", v: "con tarjeta" },
            { icon: RefreshCw, k: "En vivo", v: "stock y precios" },
          ].map(({ icon: Icon, k, v }) => (
            <div key={v} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Icon className="mx-auto mb-2 size-5 text-white/60" />
              <dt className="text-lg font-semibold">{k}</dt>
              <dd className="text-xs text-white/50">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const METHODS = [
  {
    icon: Wallet,
    title: "Mercado Pago",
    desc: "Pagá con tu cuenta de Mercado Pago, dinero en cuenta o tarjetas asociadas. Te enviamos el link de pago.",
    accent: "from-sky-500/20 to-sky-500/0 text-sky-300",
  },
  {
    icon: CreditCard,
    title: "Tarjeta de crédito en 3 cuotas",
    desc: "Llevate tu iPhone en 3 cuotas con tarjeta de crédito. Consultanos el valor de cada cuota para el modelo que elijas.",
    accent: "from-violet-500/20 to-violet-500/0 text-violet-300",
  },
  {
    icon: Banknote,
    title: "Efectivo / transferencia en USD",
    desc: "El mejor precio: pago único en dólares, en efectivo o transferencia. Es el precio que ves publicado en cada equipo.",
    accent: "from-emerald-500/20 to-emerald-500/0 text-emerald-300",
  },
];

export function Financing() {
  return (
    <section id="financiacion" className="scroll-mt-20 border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="Medios de pago" title="Financiación y Cuotas">
          Elegí cómo pagar. Los precios publicados son en USD, pago único contado o transferencia.
        </SectionTitle>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {METHODS.map(({ icon: Icon, title, desc, accent }) => (
            <div
              key={title}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent.split(" ").slice(0, 2).join(" ")}`} />
              <div className="relative">
                <div className={`mb-5 grid size-11 place-items-center rounded-2xl bg-white/5 ${accent.split(" ")[2]}`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-violet-500/10 to-sky-500/10 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">¿Querés pagar en cuotas?</p>
            <p className="text-sm text-white/60">
              Escribinos a nuestra línea de financiación: {formatPhone(STORE.whatsapp.financing)}
            </p>
          </div>
          <a
            href={financingLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 sm:w-auto"
          >
            <CreditCard className="size-4" /> Consultar Financiación / Cuotas
          </a>
        </div>
      </div>
    </section>
  );
}

export function HowToBuy() {
  const steps = [
    { icon: Smartphone, title: "Elegí tu iPhone", desc: "Filtrá por generación y mirá capacidad, condición y batería." },
    { icon: MessageCircle, title: "Escribinos por WhatsApp", desc: "Con un toque te llega un mensaje armado con el equipo que elegiste." },
    { icon: Handshake, title: "Coordinamos pago y entrega", desc: "Contado en USD, Mercado Pago o 3 cuotas con tarjeta." },
  ];
  return (
    <section id="como-comprar" className="scroll-mt-20 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="Simple y rápido" title="Cómo comprar" />
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <li key={title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-white text-sm font-semibold text-black">
                  {i + 1}
                </span>
                <Icon className="size-5 text-white/60" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-white/60">{desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer id="contacto" className="scroll-mt-20 border-t border-white/10 bg-neutral-950">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-semibold">{STORE.name}</p>
          <p className="mt-2 text-sm text-white/60">
            iPhones en {STORE.location}. Precios en USD contado y financiación en cuotas.
          </p>
          <a
            href={STORE.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:brightness-110"
          >
            <InstagramIcon className="size-4" /> {STORE.instagram.handle}
          </a>
        </div>
        <div>
          <p className="text-sm font-semibold text-white/80">Ventas · Contado USD</p>
          <a
            href={generalSalesLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            <WhatsAppIcon className="size-4 text-[#25D366]" /> {formatPhone(STORE.whatsapp.sales)}
          </a>
          <p className="mt-6 text-sm font-semibold text-white/80">Financiación · Tarjetas y cuotas</p>
          <a
            href={financingLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            <WhatsAppIcon className="size-4 text-[#25D366]" /> {formatPhone(STORE.whatsapp.financing)}
          </a>
        </div>
        <div>
          <p className="text-sm font-semibold text-white/80">Navegación</p>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            <li><a href="#catalogo" className="hover:text-white">Catálogo</a></li>
            <li><a href="#financiacion" className="hover:text-white">Financiación y Cuotas</a></li>
            <li><a href="#como-comprar" className="hover:text-white">Cómo comprar</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {STORE.name}. iPhone es una marca registrada de Apple Inc. No somos distribuidores oficiales de Apple.
      </div>
    </footer>
  );
}

export function FloatingWhatsApp() {
  return (
    <a
      href={generalSalesLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed right-4 bottom-4 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-black shadow-xl shadow-black/50 transition hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}

function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-medium text-white/50">{eyebrow}</p>
      <h2 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 text-white/60">{children}</p>}
    </div>
  );
}
