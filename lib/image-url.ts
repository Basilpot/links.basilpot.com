// ponytail: same-origin media route keeps images working locally and in prod without public-bucket config
export function imageUrl(path: string) {
  return `/api/media/${path}`;
}