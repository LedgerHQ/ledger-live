export function buildHostedUrl(baseUrl: string | undefined, path: string): string {
  if (!baseUrl) {
    throw new Error("buildHostedUrl: no base URL to address the page on");
  }

  const base = new URL(baseUrl);
  const url = new URL(path, base);

  if (url.protocol !== "https:") {
    throw new Error(`buildHostedUrl: baseUrl must be https, got "${url.protocol}"`);
  }

  if (url.origin !== base.origin) {
    throw new Error(`buildHostedUrl: the path must stay on ${base.origin}, got "${url.origin}"`);
  }

  return url.toString();
}
