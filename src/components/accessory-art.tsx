import { useId } from "react";
import { normalizeText } from "@/lib/product";

type Kind = "charger" | "cable" | "earpods" | "case" | "glass" | "magsafe" | "box";

export function accessoryKinds(title: string): Kind[] {
  const t = normalizeText(title);
  const kinds: [Kind, RegExp][] = [
    ["charger", /cargador|adaptador|fuente|cabezal/],
    ["cable", /cable/],
    ["earpods", /earpods|auricular|airpods/],
    ["case", /funda|case/],
    ["glass", /vidrio|templado|protector/],
    ["magsafe", /power ?bank|bateria externa|magsafe/],
  ];
  const found = kinds.filter(([, re]) => re.test(t)).map(([k]) => k);
  // A "Funda ... MagSafe" is a case, not a MagSafe charger.
  const list = found.includes("case") ? found.filter((k) => k !== "magsafe") : found;
  return list.length ? list : ["box"];
}

const CASE_COLORS: [RegExp, string][] = [
  [/negro|black|medianoche/, "#2f3033"],
  [/azul|blue/, "#3d5a80"],
  [/rojo|red/, "#b8263a"],
  [/rosa|pink/, "#efb7bf"],
  [/verde|green/, "#7f9c84"],
  [/violeta|lila|purple/, "#a99bd0"],
  [/transparente|clear/, "#dfe7ee"],
  [/blanco|white/, "#f2f1ec"],
];

function Item({ kind, title, uid }: { kind: Kind; title: string; uid: string }) {
  const white = `url(#${uid}w)`;
  switch (kind) {
    case "charger":
      return (
        <g>
          <rect x="66" y="22" width="7" height="22" rx="2" fill="#c9c9cf" />
          <rect x="87" y="22" width="7" height="22" rx="2" fill="#c9c9cf" />
          <rect x="42" y="40" width="76" height="80" rx="16" fill={white} stroke="#d4d4da" />
          <rect x="70" y="74" width="20" height="8" rx="4" fill="#2a2a2e" />
          <rect x="73" y="76.5" width="14" height="3" rx="1.5" fill="#55555c" />
        </g>
      );
    case "cable":
      return (
        <g fill="none" strokeLinecap="round">
          <ellipse cx="80" cy="84" rx="44" ry="26" stroke="#e7e7ec" strokeWidth="6" />
          <ellipse cx="80" cy="80" rx="36" ry="21" stroke="#f4f4f7" strokeWidth="6" />
          <ellipse cx="80" cy="76" rx="28" ry="16" stroke="#e2e2e8" strokeWidth="6" />
          <path d="M108 66 C126 52 130 40 128 30" stroke="#f1f1f4" strokeWidth="6" />
          <path d="M52 92 C34 108 30 122 34 132" stroke="#f1f1f4" strokeWidth="6" />
          <rect x="120" y="14" width="16" height="22" rx="5" fill={white} stroke="#d4d4da" strokeWidth="1" />
          <rect x="124" y="6" width="8" height="10" rx="3" fill="#b9b9c0" stroke="none" />
          <rect x="26" y="128" width="16" height="22" rx="5" fill={white} stroke="#d4d4da" strokeWidth="1" />
          <rect x="31" y="148" width="6" height="9" rx="1.5" fill="#d9c27a" stroke="none" />
        </g>
      );
    case "earpods":
      return (
        <g>
          <path d="M62 86 C60 116 76 128 80 146 M98 86 C100 116 84 128 80 146" fill="none" stroke="#ededf1" strokeWidth="3.5" strokeLinecap="round" />
          <g transform="rotate(-18 56 60)">
            <ellipse cx="56" cy="58" rx="18" ry="16" fill={white} stroke="#d4d4da" />
            <rect x="50" y="66" width="12" height="28" rx="6" fill={white} stroke="#d4d4da" />
            <ellipse cx="52" cy="54" rx="6" ry="4" fill="#9ea0a8" opacity="0.5" />
          </g>
          <g transform="rotate(18 104 60)">
            <ellipse cx="104" cy="58" rx="18" ry="16" fill={white} stroke="#d4d4da" />
            <rect x="98" y="66" width="12" height="28" rx="6" fill={white} stroke="#d4d4da" />
            <ellipse cx="108" cy="54" rx="6" ry="4" fill="#9ea0a8" opacity="0.5" />
          </g>
        </g>
      );
    case "case": {
      const t = normalizeText(title);
      const c = CASE_COLORS.find(([re]) => re.test(t))?.[1] ?? "#3d5a80";
      return (
        <g>
          <rect x="46" y="10" width="68" height="140" rx="16" fill={c} />
          <rect x="46" y="10" width="68" height="140" rx="16" fill={`url(#${uid}s)`} />
          <rect x="54" y="18" width="30" height="30" rx="9" fill="#1c1d21" />
          <circle cx="80" cy="96" r="20" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="2.5" />
        </g>
      );
    }
    case "glass":
      return (
        <g transform="rotate(-8 80 80)">
          <rect x="44" y="10" width="72" height="140" rx="16" fill="#cfe3f5" fillOpacity="0.55" stroke="#b6cfe6" strokeWidth="1.5" />
          <rect x="70" y="20" width="20" height="6" rx="3" fill="#8aa6c1" opacity="0.7" />
          <path d="M54 60 L100 24 M54 84 L108 42 M70 140 L110 108" stroke="#fff" strokeOpacity="0.75" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "magsafe":
      return (
        <g>
          <path d="M80 112 C80 132 96 140 118 146" fill="none" stroke="#ededf1" strokeWidth="4" strokeLinecap="round" />
          <circle cx="80" cy="74" r="40" fill={white} stroke="#d4d4da" />
          <circle cx="80" cy="74" r="26" fill="none" stroke="#c9c9d0" strokeWidth="2" />
          <circle cx="80" cy="74" r="4" fill="#c9c9d0" />
        </g>
      );
    default:
      return (
        <g>
          <path d="M30 56 L80 32 L130 56 L80 80 Z" fill="#f7f7f9" stroke="#d4d4da" />
          <path d="M30 56 L80 80 L80 140 L30 116 Z" fill="#e6e6eb" stroke="#d4d4da" />
          <path d="M130 56 L80 80 L80 140 L130 116 Z" fill="#d9d9df" stroke="#d4d4da" />
        </g>
      );
  }
}

/** Clean product render for accessories; combos show up to three of their items. */
export function AccessoryArt({ title }: { title: string }) {
  const uid = useId().replace(/:/g, "");
  const kinds = accessoryKinds(title).slice(0, 3);
  const slots =
    kinds.length === 1
      ? [{ x: 0, y: 0, s: 1 }]
      : kinds.length === 2
        ? [{ x: -12, y: -10, s: 0.82 }, { x: 40, y: 34, s: 0.78 }]
        : [{ x: -24, y: -14, s: 0.7 }, { x: 52, y: -10, s: 0.66 }, { x: 18, y: 52, s: 0.66 }];
  return (
    <svg viewBox="0 0 160 160" className="h-full w-auto max-w-full drop-shadow-[0_16px_18px_rgba(0,0,0,0.22)]" role="img" aria-label={title}>
      <defs>
        <linearGradient id={`${uid}w`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e4e4e9" />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {kinds.map((k, i) => (
        <g key={k} transform={`translate(${slots[i].x} ${slots[i].y}) scale(${slots[i].s})`}>
          <Item kind={k} title={title} uid={uid} />
        </g>
      ))}
    </svg>
  );
}
