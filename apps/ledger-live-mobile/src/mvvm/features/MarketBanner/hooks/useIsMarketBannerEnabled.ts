import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

/**
 * Hook to check if the market banner feature is enabled.
 */
export function useIsMarketBannerEnabled(): boolean {
  const lwmWallet40 = useFeature("lwmWallet40");
  return Boolean(lwmWallet40?.enabled && lwmWallet40?.params?.marketBanner);
}
