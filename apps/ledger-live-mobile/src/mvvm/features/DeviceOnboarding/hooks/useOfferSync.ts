import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";

export function useOfferSync(): boolean {
  const deviceOnboarding = useFeature("deviceOnboarding");
  const hasTrustchain = Boolean(useSelector(trustchainSelector)?.rootId);

  return Boolean(
    deviceOnboarding?.enabled && deviceOnboarding.params?.offerLedgerSync && !hasTrustchain,
  );
}
