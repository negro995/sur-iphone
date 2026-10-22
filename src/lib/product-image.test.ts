import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { CANVAS, prepareProductImage } from "./product-image";

async function alphaAt(buf: Buffer, x: number, y: number) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return data[(y * info.width + x) * 4 + 3];
}

describe("prepareProductImage", () => {
  it("removes a plain white backdrop and centres the device on a 3:2 canvas", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024">
      <rect width="1536" height="1024" fill="#f4f4f6"/>
      <rect x="600" y="200" width="300" height="600" rx="40" fill="#e9e9ec" stroke="#8e8e93" stroke-width="6"/>
    </svg>`;
    const out = await prepareProductImage(await sharp(Buffer.from(svg)).jpeg().toBuffer());
    expect(out.removedBackground).toBe(true);
    const meta = await sharp(out.data).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(["webp", CANVAS.width, CANVAS.height]);
    expect(await alphaAt(out.data, 5, 5)).toBe(0);
    for (let y = 250; y <= 550; y += 7) expect(await alphaAt(out.data, 600, y)).toBe(255);
  });

  it("fits portrait real-scene photos whole on the 3:2 canvas (no cut-out, no stretch)", async () => {
    const noise = Buffer.alloc(900 * 1600 * 3);
    for (let i = 0; i < noise.length; i++) noise[i] = (i * 7919) % 251;
    const jpg = await sharp(noise, { raw: { width: 900, height: 1600, channels: 3 } }).jpeg().toBuffer();
    const out = await prepareProductImage(jpg);
    expect(out).toMatchObject({ removedBackground: false, fit: "contain" });
    const meta = await sharp(out.data).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(["webp", CANVAS.width, CANVAS.height]);
  });

  it("fills the canvas with near-3:2 scene photos", async () => {
    const noise = Buffer.alloc(1600 * 1000 * 3);
    for (let i = 0; i < noise.length; i++) noise[i] = (i * 7919) % 251;
    const jpg = await sharp(noise, { raw: { width: 1600, height: 1000, channels: 3 } }).jpeg().toBuffer();
    const out = await prepareProductImage(jpg);
    expect(out.fit).toBe("cover");
    const meta = await sharp(out.data).metadata();
    expect([meta.width, meta.height]).toEqual([CANVAS.width, CANVAS.height]);
  });

  it("uses the alpha channel of transparent PNGs as the cut-out", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000">
      <rect x="250" y="150" width="300" height="700" rx="40" fill="#111"/>
    </svg>`;
    const out = await prepareProductImage(await sharp(Buffer.from(svg)).png().toBuffer());
    expect(out).toMatchObject({ removedBackground: true, fit: "cutout" });
    expect(await alphaAt(out.data, 5, 5)).toBe(0);
    expect(await alphaAt(out.data, 600, 400)).toBe(255);
  });
});
