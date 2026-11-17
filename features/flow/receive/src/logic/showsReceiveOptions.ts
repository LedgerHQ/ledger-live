type ShowsReceiveOptionsParams = Readonly<{
  /** The `noah` feature flag, absent when not resolved. */
  noah?: Readonly<{
    enabled: boolean;
    params?: Readonly<{ activeCurrencyIds?: readonly string[] }>;
  }>;
  /** `false` when the entry point asks for no options (the receive deeplink). */
  shouldUseReceiveOptions?: boolean;
  /** The asset of the account the receive starts from. */
  accountAssetId?: string;
  /** The assets of the page the receive starts from (asset page). */
  pageAssetIds?: readonly string[];
}>;

/**
 * Whether the legacy receive modal first offers Noah's "crypto or bank transfer" choice: only for
 * an asset with a bank transfer option, or for any asset when the receive starts from nowhere.
 */
export function showsReceiveOptions({
  noah,
  shouldUseReceiveOptions,
  accountAssetId,
  pageAssetIds,
}: ShowsReceiveOptionsParams): boolean {
  if (!noah?.enabled || shouldUseReceiveOptions === false) return false;
  const activeCurrencyIds = noah.params?.activeCurrencyIds ?? [];
  if (accountAssetId) return activeCurrencyIds.includes(accountAssetId);
  if (pageAssetIds?.length) return pageAssetIds.some(id => activeCurrencyIds.includes(id));
  return true;
}
