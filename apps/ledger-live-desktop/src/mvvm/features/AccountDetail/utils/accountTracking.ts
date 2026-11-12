import type { Account } from "@ledgerhq/types-live";
import type { AccountTrackingFacts } from "@features/flow-account-detail";

export const getAccountTrackingFacts = (account: Account): AccountTrackingFacts => ({
  networkId: account.currency.id,
});
