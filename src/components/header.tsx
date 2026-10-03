"use client";

import { useState } from "react";
import { Menu, Smartphone, X } from "lucide-react";
import { STORE } from "@/lib/config";
import { generalSalesLink } from "@/lib/whatsapp";
import { InstagramIcon, WhatsAppIcon } from "./brand-icons";

const NAV = [
  { href: "#catalogo", label: "Catálogo" },
  { href: "#financiacion", label: "Financiación" },
  { href: "#como-comprar", label: "Cómo comprar" },
  { href: "#contacto", label: "Contacto" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-white text-black">
            <Smartphone className="size-4" />
          </span>
          {STORE.name}
        </a>

        <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="transition hover:text-white">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={STORE.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram ${STORE.instagram.handle}`}
            className="flex items-center gap-2 rounded-full bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] px-3 py-1.5 text-sm font-medium text-white shadow-lg shadow-pink-500/20 transition hover:brightness-110"
          >
            <InstagramIcon className="size-4" />
            <span className="hidden sm:inline">{STORE.instagram.handle}</span>
          </a>
          <a
            href={generalSalesLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full bg-[#25D366] px-3 py-1.5 text-sm font-medium text-black transition hover:brightness-110 sm:flex"
          >
            <WhatsAppIcon className="size-4" />
            WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="grid size-9 place-items-center rounded-full text-white/80 hover:bg-white/10 md:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-black/95 px-4 py-3 md:hidden">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-base text-white/80 hover:bg-white/5 hover:text-white"
            >
              {n.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
