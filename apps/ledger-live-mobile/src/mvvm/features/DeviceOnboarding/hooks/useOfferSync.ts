import { selectIsLedgerSyncActive } from "@domain/entity-key-ring";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";

export function useOfferSync(): boolean {
  const deviceOnboarding = useFeature("deviceOnboarding");
  const hasTrustchain = useSelector(selectIsLedgerSyncActive);

  return Boolean(
    deviceOnboarding?.enabled && deviceOnboarding.params?.offerLedgerSync && !hasTrustchain,
  );
}
