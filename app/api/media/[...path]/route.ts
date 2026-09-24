import { env } from "cloudflare:workers";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.join("/");
  if (!key || path.some(part => part === "..")) return new Response(null, { status: 400 });
  const object = await env.linkbio_media.get(key);
  if (!object) return new Response(null, { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}