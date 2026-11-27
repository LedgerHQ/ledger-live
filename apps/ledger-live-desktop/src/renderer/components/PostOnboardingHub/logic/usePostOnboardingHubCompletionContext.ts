import { useMemo } from "react";
import { selectIsLedgerSyncActive } from "@domain/entity-key-ring";
import { useFeature } from "@features/platform-feature-flags";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { productTourCompletedSelector } from "~/renderer/reducers/settings";

export type PostOnboardingHubCompletionContext = {
  readonly isLedgerSyncActive: boolean;
  readonly accounts: Account[];
  readonly protectId: string;
  readonly productTourCompleted?: boolean;
};

export function usePostOnboardingHubCompletionContext(): PostOnboardingHubCompletionContext {
  const isLedgerSyncActive = useSelector(selectIsLedgerSyncActive);
  const accounts = useSelector(accountsSelector);
  const productTourCompleted = useSelector(productTourCompletedSelector);

  const recoverServices = useFeature("protectServicesDesktop");
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
