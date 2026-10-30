function encodePathSegment(segment: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(segment));
  } catch {
    return encodeURIComponent(segment);
  }
}

export function getAssetDetailPath(currencyId: string): string {
  return `/asset/${encodePathSegment(currencyId)}`;
}

/** True for an asset detail page (`/asset/:id`), not the bare `/asset` path. */
export function isAssetDetailPath(pathname: string): boolean {
  return /^\/asset\/[^/]+(?:\/|$)/.test(pathname);
}
