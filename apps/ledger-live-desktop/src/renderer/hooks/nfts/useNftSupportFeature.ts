import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

export function useNftSupportFeature() {
  const nftSupport = useFeature("llNftSupport");
  return {
    nftSupportEnabled: !!nftSupport?.enabled,
  };
}
