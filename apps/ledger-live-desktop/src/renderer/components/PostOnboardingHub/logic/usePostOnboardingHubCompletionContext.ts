import { useMemo } from "react";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
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
  const trustchain = useSelector(trustchainSelector);
  const accounts = useSelector(accountsSelector);
  const productTourCompleted = useSelector(productTourCompletedSelector);

  const recoverServices = useFeature("protectServicesDesktop");
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
