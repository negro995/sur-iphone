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

  it("keeps real-scene photos intact (no cut-out, no crop)", async () => {
    const noise = Buffer.alloc(900 * 1600 * 3);
    for (let i = 0; i < noise.length; i++) noise[i] = (i * 7919) % 251;
    const jpg = await sharp(noise, { raw: { width: 900, height: 1600, channels: 3 } }).jpeg().toBuffer();
    const out = await prepareProductImage(jpg);
    expect(out.removedBackground).toBe(false);
    const meta = await sharp(out.data).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width! / meta.height!).toBeCloseTo(900 / 1600, 2);
  });
});
