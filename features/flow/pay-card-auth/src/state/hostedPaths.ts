const SIGNUP_PATH = "/onboarding/signup";
const TOP_UP_PATH = "/topup";
const WITHDRAWAL_PATH = "/withdrawal";
const MANAGE_PIN_PATH = "/dashboard/card/details";
const ACCESS_BAANX_PATH = "/";

export { SIGNUP_PATH, MANAGE_PIN_PATH };

export type CardAssetPathBuilder = (usAppId?: string | null, currency?: string | null) => string;

function buildHostedPath(page: string, usAppId?: string | null, currency?: string | null): string {
  const query = new URLSearchParams();

  if (usAppId) query.set("app_id", usAppId);
  if (currency) query.set("currency", currency);

  const search = query.toString();

  return search ? `${page}?${search}` : page;
}

export const buildTopUpPath: CardAssetPathBuilder = (usAppId, currency) =>
  buildHostedPath(TOP_UP_PATH, usAppId, currency);

export const buildWithdrawalPath: CardAssetPathBuilder = (usAppId, currency) =>
  buildHostedPath(WITHDRAWAL_PATH, usAppId, currency);

export function buildAccessBaanxPath(usAppId?: string | null): string {
  return buildHostedPath(ACCESS_BAANX_PATH, usAppId);
}
