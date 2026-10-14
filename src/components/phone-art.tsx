import { useId } from "react";
import { normalizeText } from "@/lib/product";

type Layout = "square2" | "diag2" | "pill2" | "pro3" | "plateau3" | "air" | "single";

const COLORS: [RegExp, string][] = [
  [/naranja|orange|cosmic|cosmico/, "#e2752e"],
  [/desierto|desert/, "#c9ae92"],
  [/natural/, "#bdb6ab"],
  [/titanio negro|black titanium|negro espacial|space black|grafito|graphite|negro|black|midnight|medianoche/, "#2f3033"],
  [/titanio blanco|white titanium|blanco estelar|starlight|blanco|white|plata|silver/, "#eceae4"],
  [/ultramar/, "#6f7dcf"],
  [/teal|verde azulado|turquesa/, "#7fb5b0"],
  [/sierra|celeste|azul alpino/, "#a6bdd6"],
  [/pacific|pacifico|azul|blue/, "#3c5a78"],
  [/verde noche|midnight green/, "#3f4c46"],
  [/verde alpino|alpine|verde|green/, "#a9bfa6"],
  [/purpura oscuro|deep purple|morado oscuro/, "#5a4f66"],
  [/lavanda|lavender|lila|violeta|purple|morado/, "#cdc3e3"],
  [/rosa|pink|rosado/, "#f0cfd2"],
  [/amarillo|yellow/, "#f2e19a"],
  [/rojo|red/, "#b8263a"],
  [/dorado|gold|oro/, "#e8d6b8"],
];

const BASE: Record<number, string> = { 11: "#cdc3e3", 12: "#3c5a78", 13: "#f0cfd2", 14: "#a6bdd6", 15: "#a9bfa6", 16: "#6f7dcf", 17: "#c9c0dd" };
const PRO: Record<number, string> = { 11: "#3f4c46", 12: "#3c5a78", 13: "#a6bdd6", 14: "#5a4f66", 15: "#bdb6ab", 16: "#c9ae92", 17: "#e2752e" };

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function layoutFor(t: string, gen: number | null, pro: boolean): Layout {
  if (/\bair\b/.test(t)) return "air";
  if (/\bse\b|\d+e\b/.test(t)) return "single";
  if (pro) return gen === 17 ? "plateau3" : "pro3";
  if ((gen ?? 15) >= 16) return "pill2";
  if ((gen ?? 15) >= 13) return "diag2";
  return "square2";
}

/** Clean back-view render of an iPhone: camera layout by model, finish by color in the title. */
export function PhoneArt({ title, generation }: { title: string; generation: number | null }) {
  const uid = useId().replace(/:/g, "");
  const t = normalizeText(title);
  const pro = /\bpro\b/.test(t);
  const gen = generation ?? 15;
  const color = COLORS.find(([re]) => re.test(t))?.[1] ?? (pro ? PRO[gen] : BASE[gen]) ?? "#bdb6ab";
  const layout = layoutFor(t, generation, pro);
  const dark = parseInt(color.slice(1, 3), 16) < 110;
  const frame = shade(color, pro ? -0.3 : -0.18);
  const bump = shade(color, dark ? 0.1 : -0.06);
  const ring = shade(color, -0.45);

  const lens = (cx: number, cy: number, r = 7) => (
    <g>
      <circle cx={cx} cy={cy} r={r + 2.4} fill={ring} stroke={shade(color, 0.35)} strokeOpacity="0.6" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r={r} fill="#07080c" />
      <circle cx={cx} cy={cy} r={r * 0.58} fill="#18203a" />
      <circle cx={cx} cy={cy} r={r * 0.25} fill="#0a0d18" />
      <circle cx={cx - r * 0.32} cy={cy - r * 0.32} r={r * 0.2} fill="#fff" opacity="0.45" />
    </g>
  );
  const flash = (cx: number, cy: number) => <circle cx={cx} cy={cy} r="2.8" fill="#f6f1e3" stroke={ring} strokeWidth="0.6" />;
  const dot = (cx: number, cy: number, r = 3) => <circle cx={cx} cy={cy} r={r} fill="#1b1c20" />;
  const plate = (x: number, y: number, w: number, h: number, rx: number) => (
    <rect x={x} y={y} width={w} height={h} rx={rx} fill={bump} stroke={shade(color, -0.25)} strokeOpacity="0.5" />
  );

  const camera: Record<Layout, React.ReactNode> = {
    square2: <>{plate(15, 15, 40, 40, 11)}{lens(26, 26)}{lens(26, 44)}{flash(44, 26)}{dot(44, 44, 1.2)}</>,
    diag2: <>{plate(15, 15, 40, 40, 11)}{lens(44, 26)}{lens(26, 44)}{flash(25, 25)}{dot(45, 45, 1.2)}</>,
    pill2: <>{plate(16, 15, 24, 52, 12)}{lens(28, 27)}{lens(28, 55)}{flash(48, 24)}</>,
    pro3: <>{plate(14, 14, 50, 50, 13)}{lens(27, 27, 7.5)}{lens(27, 51, 7.5)}{lens(49, 39, 7.5)}{flash(50, 22)}{dot(50, 56)}</>,
    plateau3: <>{plate(10, 10, 100, 64, 18)}{lens(28, 29, 8)}{lens(28, 55, 8)}{lens(51, 42, 8)}{flash(90, 30)}{dot(90, 54)}</>,
    air: <>{plate(10, 12, 100, 32, 16)}{lens(30, 28, 8)}{flash(52, 28)}</>,
    single: <>{lens(26, 26, 7)}{flash(44, 24)}</>,
  };

  return (
    <svg viewBox="0 0 120 240" className="h-full w-auto drop-shadow-[0_18px_22px_rgba(0,0,0,0.28)]" role="img" aria-label={title}>
      <defs>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={shade(color, 0.12)} />
          <stop offset="1" stopColor={shade(color, -0.12)} />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <rect x="5.5" y="52" width="3" height="12" rx="1.2" fill={frame} />
      <rect x="5.5" y="72" width="3" height="22" rx="1.2" fill={frame} />
      <rect x="5.5" y="98" width="3" height="22" rx="1.2" fill={frame} />
      <rect x="111.5" y="82" width="3" height="32" rx="1.2" fill={frame} />
      <rect x="7" y="5" width="106" height="230" rx="21" fill={frame} />
      <rect x="9" y="7" width="102" height="226" rx="19.5" fill={`url(#${uid}b)`} />
      {camera[layout]}
      <rect x="9" y="7" width="102" height="226" rx="19.5" fill={`url(#${uid}s)`} pointerEvents="none" />
    </svg>
  );
}
