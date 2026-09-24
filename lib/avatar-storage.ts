import { env } from "cloudflare:workers";

export const imageTypes = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;
export type ImageType = keyof typeof imageTypes;

export async function deleteImage(path: string) {
  await env.linkbio_media.delete(path);
}

export async function putImage(path: string, type: ImageType, file: File) {
  await env.linkbio_media.put(path, file.stream(), { httpMetadata: { contentType: type } });
  return `/api/media/${path}`;
}
