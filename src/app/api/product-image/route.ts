import { getCatalog } from "@/lib/catalog";
import { prepareProductImage } from "@/lib/product-image";

const MAX_BYTES = 15 * 1024 * 1024;

/** Serves catalogue photos (from the sheet's imagen_url) as optimised 3:2 WebP. */
export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get("src");
  if (!src) return new Response("Missing src", { status: 400 });

  const { products } = await getCatalog();
  if (!products.some((p) => p.imageUrl === src)) return new Response("Unknown image", { status: 404 });

  try {
    const res = await fetch(src, { next: { revalidate: 86400 } });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return new Response("Image unavailable", { status: 502 });
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) return new Response("Image too large", { status: 413 });

    const { data, removedBackground, fit } = await prepareProductImage(buf);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "X-Background": removedBackground ? "removed" : "kept",
        "X-Fit": fit,
      },
    });
  } catch {
    return new Response("Image unavailable", { status: 502 });
  }
}
