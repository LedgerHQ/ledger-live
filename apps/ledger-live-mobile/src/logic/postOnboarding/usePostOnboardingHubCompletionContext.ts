import { useMemo } from "react";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";

export type PostOnboardingHubCompletionContext = {
  readonly isLedgerSyncActive: boolean;
  readonly accounts: Account[];
  readonly protectId: string;
};

export function usePostOnboardingHubCompletionContext(): PostOnboardingHubCompletionContext {
  const trustchain = useSelector(trustchainSelector);
  const accounts = useSelector(accountsSelector);

  const recoverServices = useFeature("protectServicesMobile");
  const protectId = recoverServices?.params?.protectId ?? "protect-prod";

  return useMemo(
    () => ({
      isLedgerSyncActive: Boolean(trustchain?.rootId),
      accounts,
      protectId,
    }),
    [trustchain, accounts],
  );
}
