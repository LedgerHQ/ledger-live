import type { ResolveWalletApiTermsParams, WalletApiResolvedTerms } from "./types";

function getOwnString(record: Readonly<Record<string, string>>, key: string): string | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

export function resolveWalletApiTerms({
  manifestId,
  manifestName,
  recipient,
  sources,
}: ResolveWalletApiTermsParams): WalletApiResolvedTerms | null {
  if (!manifestId) {
    return null;
  }

  const normalizedRecipient = recipient?.toLowerCase() ?? "";
  const appNameByAddress = getOwnString(sources.dexProvidersContractAddress, normalizedRecipient);
  const providerKey = appNameByAddress || manifestId;
  const termsOfUseUrl = getOwnString(sources.termsOfUse, providerKey);

  if (!termsOfUseUrl) {
    return null;
  }

  return {
    appName: appNameByAddress || manifestName || manifestId,
    termsOfUseUrl,
    privacyUrl: getOwnString(sources.privacyPolicy, providerKey),
  };
}
