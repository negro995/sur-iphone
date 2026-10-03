const FINISHES: Record<number, [string, string]> = {
  11: ["#3a3a3c", "#1c1c1e"],
  12: ["#2c3e50", "#141e28"],
  13: ["#3d4a5c", "#1a2230"],
  14: ["#4b4152", "#211c26"],
  15: ["#4a4a46", "#1f1f1c"],
  16: ["#5a4f45", "#24201b"],
  17: ["#c46a2b", "#5a2c10"],
};

export function PhoneArt({ generation, pro }: { generation: number | null; pro: boolean }) {
  const [from, to] =
    generation === 17 && !pro ? ["#8e86a8", "#3b3550"] : (FINISHES[generation ?? 15] ?? FINISHES[15]);
  const id = `g-${generation ?? "x"}-${pro ? "p" : "b"}`;
  return (
    <svg viewBox="0 0 120 220" className="h-full w-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="6" y="4" width="108" height="212" rx="22" fill={`url(#${id})`} stroke="#ffffff22" strokeWidth="1.5" />
      <rect x="6" y="4" width="108" height="212" rx="22" fill={`url(#${id}-shine)`} />
      {pro ? (
        <g>
          <rect x="16" y="14" width="50" height="50" rx="14" fill="#00000055" stroke="#ffffff1a" />
          <circle cx="30" cy="28" r="9" fill="#0b0b0c" stroke="#ffffff30" strokeWidth="2" />
          <circle cx="30" cy="50" r="9" fill="#0b0b0c" stroke="#ffffff30" strokeWidth="2" />
          <circle cx="52" cy="39" r="9" fill="#0b0b0c" stroke="#ffffff30" strokeWidth="2" />
          <circle cx="52" cy="22" r="2.5" fill="#ffffff40" />
        </g>
      ) : (
        <g>
          <rect x="16" y="14" width="34" height="56" rx="14" fill="#00000040" stroke="#ffffff1a" />
          <circle cx="33" cy="30" r="9" fill="#0b0b0c" stroke="#ffffff30" strokeWidth="2" />
          <circle cx="33" cy="54" r="9" fill="#0b0b0c" stroke="#ffffff30" strokeWidth="2" />
        </g>
      )}
      <path d="M60 104c3-4 7-5 9-4-1 3-4 6-9 4zm-3 3c-7 0-11 5-11 12 0 9 6 18 10 18 2 0 3-1 5-1s3 1 5 1c3 0 6-4 8-9-4-2-6-5-6-9 0-3 2-6 5-8-2-3-5-4-8-4-2 0-4 1-5 1s-2-1-3-1z" fill="#ffffff26" />
    </svg>
  );
}
