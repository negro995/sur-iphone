export const STORE = {
  name: "Sur IPhone",
  location: "Esquel, Chubut",
  instagram: {
    handle: "@esquel_iphone",
    url: "https://instagram.com/esquel_iphone",
  },
  whatsapp: {
    sales: "542945546004",
    financing: "542945690678",
  },
  sheetId:
    process.env.GOOGLE_SHEET_ID ?? "1VVLezC-1LWBEyK9j3MJ96sA5TuPftbOeTK0Va1vqk4U",
} as const;

export const GENERATIONS = [11, 12, 13, 14, 15, 16, 17] as const;

export function formatPhone(n: string) {
  // 542945546004 -> +54 2945 54-6004
  return `+${n.slice(0, 2)} ${n.slice(2, 6)} ${n.slice(6, 8)}-${n.slice(8)}`;
}
