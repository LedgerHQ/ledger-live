import { useMemo } from "react";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";

export type PostOnboardingHubCompletionContext = {
  readonly isLedgerSyncActive: boolean;
  readonly accounts: Account[];
};

export function usePostOnboardingHubCompletionContext(): PostOnboardingHubCompletionContext {
  const trustchain = useSelector(trustchainSelector);
  const accounts = useSelector(accountsSelector);

  return useMemo(
    () => ({
      isLedgerSyncActive: Boolean(trustchain?.rootId),
      accounts,
    }),
    [trustchain, accounts],
  );
}
