"use client";

import { useState } from "react";
import { Quote, Star } from "lucide-react";
import type { Testimonial } from "@/lib/types";
import { STORE } from "@/lib/config";
import { InstagramIcon } from "./brand-icons";

export function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  return (
    <section id="opiniones" className="scroll-mt-20 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-white/50">Clientes reales</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Lo que dicen de nosotros</h2>
          </div>
          <a
            href={STORE.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            <InstagramIcon className="size-4" /> Más referencias en {STORE.instagram.handle}
          </a>
        </div>
        <div className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {items.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  const [broken, setBroken] = useState(false);
  const initial = (t.name ?? "C").trim().charAt(0).toUpperCase();
  return (
    <figure className="flex w-[85%] shrink-0 snap-start flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:w-auto">
      <div className="flex items-center justify-between">
        <Quote className="size-6 text-white/25" />
        {t.rating && (
          <div className="flex gap-0.5" aria-label={`${t.rating} de 5 estrellas`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={`size-4 ${i < t.rating! ? "fill-amber-300 text-amber-300" : "text-white/20"}`} />
            ))}
          </div>
        )}
      </div>
      <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-white/80">“{t.quote}”</blockquote>
      {t.imageUrl && !broken && (
        <a href={t.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-5 block overflow-hidden rounded-2xl border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element -- screenshots from the sheet */}
          <img
            src={t.imageUrl}
            alt={`Captura de la referencia${t.name ? ` de ${t.name}` : ""}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            className="max-h-64 w-full object-cover object-top"
          />
        </a>
      )}
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-white/10 text-sm font-semibold">{initial}</span>
        <span className="text-sm">
          <span className="block font-semibold">{t.name ?? "Cliente"}</span>
          {t.location && <span className="text-white/50">{t.location}</span>}
        </span>
      </figcaption>
    </figure>
  );
}
