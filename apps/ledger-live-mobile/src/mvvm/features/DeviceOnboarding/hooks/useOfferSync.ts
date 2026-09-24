import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";

export function useOfferSync(): boolean {
  const walletSync = useFeature("llmWalletSync");
  const onboardingSync = useFeature("llmOnboardingEnableSync");
  const hasTrustchain = Boolean(useSelector(trustchainSelector)?.rootId);

  return Boolean(
    walletSync?.enabled &&
    onboardingSync?.enabled &&
    onboardingSync.params?.touchscreens &&
    !hasTrustchain,
  );
}
