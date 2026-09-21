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
const WITHDRAWAL_PATH = "/withdrawal";

export type CardAssetPathBuilder = (usAppId?: string | null, currency?: string | null) => string;

function buildAssetPath(page: string, usAppId?: string | null, currency?: string | null): string {
  const query = new URLSearchParams();

  if (usAppId) query.set("app_id", usAppId);
  if (currency) query.set("currency", currency);

  const search = query.toString();

  return search ? `${page}?${search}` : page;
}

export const buildTopUpPath: CardAssetPathBuilder = (usAppId, currency) =>
  buildAssetPath(TOP_UP_PATH, usAppId, currency);

export const buildWithdrawalPath: CardAssetPathBuilder = (usAppId, currency) =>
  buildAssetPath(WITHDRAWAL_PATH, usAppId, currency);
