import { useMemo } from "react";
import { selectIsLedgerSyncActive } from "@domain/entity-key-ring";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { productTourCompletedSelector } from "~/reducers/settings";
import type { PostOnboardingHubActionCompletionContext } from "~/logic/postOnboarding/postOnboardingHubCompletion";

export type PostOnboardingHubCompletionContext = Readonly<PostOnboardingHubActionCompletionContext>;

export function usePostOnboardingHubCompletionContext(): PostOnboardingHubCompletionContext {
  const isLedgerSyncActive = useSelector(selectIsLedgerSyncActive);
  const accounts = useSelector(accountsSelector);
  const productTourCompleted = useSelector(productTourCompletedSelector);

  const recoverServices = useFeature("protectServicesMobile");
  const protectId = recoverServices?.params?.protectId ?? "protect-prod";

  return useMemo(
    () => ({
      isLedgerSyncActive,
      accounts,
      protectId,
      productTourCompleted,
    }),
    [isLedgerSyncActive, accounts, protectId, productTourCompleted],
  );
}
