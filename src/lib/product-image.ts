import sharp from "sharp";

export const CANVAS = { width: 1200, height: 800 };
/** Share of the canvas height the device should fill after background removal. */
const FILL = 0.9;
/** RGB distance under which a pixel counts as background colour. */
const BG_TOLERANCE = 26;
/** Share of the border that must match the background colour to treat it as a plain studio backdrop. */
const UNIFORM_BORDER = 0.9;

type Raw = { data: Buffer; width: number; height: number };

function dist(d: Buffer, i: number, c: [number, number, number]) {
  const r = d[i] - c[0];
  const g = d[i + 1] - c[1];
  const b = d[i + 2] - c[2];
  return Math.sqrt(r * r + g * g + b * b);
}

function borderIndices(width: number, height: number) {
  const ids: number[] = [];
  for (let x = 0; x < width; x++) ids.push(x, (height - 1) * width + x);
  for (let y = 1; y < height - 1; y++) ids.push(y * width, y * width + width - 1);
  return ids;
}

/** Median border colour if the border is a near-uniform backdrop, else null. */
export function plainBackdrop({ data, width, height }: Raw): [number, number, number] | null {
  const ids = borderIndices(width, height);
  const ch = (k: number) => ids.map((p) => data[p * 4 + k]).sort((a, b) => a - b)[ids.length >> 1];
  const c: [number, number, number] = [ch(0), ch(1), ch(2)];
  const close = ids.filter((p) => dist(data, p * 4, c) <= BG_TOLERANCE).length;
  return close / ids.length >= UNIFORM_BORDER ? c : null;
}

/** Flood-fills the backdrop from the edges; returns a mask (255 = product, 0 = backdrop). */
function productMask({ data, width, height }: Raw, bg: [number, number, number]) {
  const mask = new Uint8Array(width * height).fill(255);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  for (const p of borderIndices(width, height)) {
    if (mask[p] && dist(data, p * 4, bg) <= BG_TOLERANCE) {
      mask[p] = 0;
      queue[tail++] = p;
    }
  }
  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    const next = [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width];
    for (const n of next) {
      if (n < 0 || n >= mask.length || !mask[n]) continue;
      if (dist(data, n * 4, bg) <= BG_TOLERANCE) {
        mask[n] = 0;
        queue[tail++] = n;
      }
    }
  }
  return mask;
}

function bbox(mask: Uint8Array, width: number, height: number) {
  let [x0, y0, x1, y1] = [width, height, -1, -1];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y * width + x]) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

/**
 * Normalises a catalogue photo to a 3:2 WebP. Plain studio backdrops (white/grey sheets,
 * renders) are removed so the device sits on the card's own grey with a soft shadow;
 * photos taken in a real scene are only resized, never cropped.
 */
export async function prepareProductImage(input: Buffer) {
  const base = sharp(input).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true });
  const { data, info } = await base.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const raw = { data, width: info.width, height: info.height };
  const bg = plainBackdrop(raw);
  const mask = bg && productMask(raw, bg);
  const box = mask && bbox(mask, raw.width, raw.height);

  if (!mask || !box || box.width * box.height < raw.width * raw.height * 0.02) {
    const data = await sharp(input)
      .rotate()
      .resize({ ...CANVAS, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return { data, removedBackground: false };
  }

  // Feather the cut edge inwards only, so no backdrop colour bleeds into the halo.
  const soft = await sharp(Buffer.from(mask), { raw: { width: raw.width, height: raw.height, channels: 1 } })
    .blur(0.8)
    .extractChannel(0)
    .raw()
    .toBuffer();
  for (let p = 0; p < mask.length; p++) data[p * 4 + 3] = Math.min(mask[p], soft[p]);
  const cutout = await sharp(data, { raw: { width: raw.width, height: raw.height, channels: 4 } })
    .extract(box)
    .png()
    .toBuffer();
  const scale = Math.min((CANVAS.height * FILL) / box.height, (CANVAS.width * 0.94) / box.width);
  const w = Math.max(1, Math.round(box.width * scale));
  const h = Math.max(1, Math.round(box.height * scale));
  const device = await sharp(cutout).resize(w, h).png().toBuffer();
  const alpha = await sharp(device).extractChannel(3).png().toBuffer();
  const pad = 30;
  const shadow = await sharp(alpha)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: "#000" })
    .linear(0.22, 0)
    .blur(14)
    .toBuffer()
    .then((a) =>
      sharp({ create: { width: w + pad * 2, height: h + pad * 2, channels: 3, background: "#000" } })
        .joinChannel(a)
        .png()
        .toBuffer()
    );
  const left = Math.round((CANVAS.width - w) / 2);
  const top = Math.round((CANVAS.height - h) / 2);
  const out = await sharp({ create: { ...CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: shadow, left: left - pad, top: top - pad + 10 },
      { input: device, left, top },
    ])
    .webp({ quality: 85, alphaQuality: 90 })
    .toBuffer();
  return { data: out, removedBackground: true };
}
