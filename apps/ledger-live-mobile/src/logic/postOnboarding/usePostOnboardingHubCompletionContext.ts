import { useMemo } from "react";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { productTourCompletedSelector } from "~/reducers/settings";
import type { PostOnboardingHubActionCompletionContext } from "~/logic/postOnboarding/postOnboardingHubCompletion";

export type PostOnboardingHubCompletionContext = Readonly<PostOnboardingHubActionCompletionContext>;

export function usePostOnboardingHubCompletionContext(): PostOnboardingHubCompletionContext {
  const trustchain = useSelector(trustchainSelector);
  const accounts = useSelector(accountsSelector);
  const productTourCompleted = useSelector(productTourCompletedSelector);

  const recoverServices = useFeature("protectServicesMobile");
  const protectId = recoverServices?.params?.protectId ?? "protect-prod";

  return useMemo(
    () => ({
      isLedgerSyncActive: Boolean(trustchain?.rootId),
      accounts,
      protectId,
      productTourCompleted,
    }),
    [trustchain, accounts, protectId, productTourCompleted],
  );
}
