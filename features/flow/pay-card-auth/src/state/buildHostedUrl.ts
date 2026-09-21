export function buildHostedUrl(baseUrl: string | undefined, path: string): string {
  if (!baseUrl) {
    throw new Error("buildHostedUrl: no base URL to address the page on");
  }

  const base = new URL(baseUrl);

  if (base.protocol !== "https:") {
    throw new Error(`buildHostedUrl: baseUrl must be https, got "${base.protocol}"`);
  }

  const url = new URL(path, base);

  if (url.origin !== base.origin) {
    throw new Error(`buildHostedUrl: the path must stay on ${base.origin}, got "${url.origin}"`);
  }

  return url.toString();
}

const TOP_UP_PATH = "/topup";

export function buildTopUpPath(usAppId?: string | null, currency?: string | null): string {
  const query = new URLSearchParams();

  if (usAppId) query.set("app_id", usAppId);
  if (currency) query.set("currency", currency);

  const search = query.toString();

  return search ? `${TOP_UP_PATH}?${search}` : TOP_UP_PATH;
}
