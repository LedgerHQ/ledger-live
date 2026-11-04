import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import type { AccountTrackingFacts } from "@features/flow-account-detail";

export const getAccountTrackingFacts = (account: AccountLike): AccountTrackingFacts => ({
  currencyId: getAccountCurrency(account).id,
  isTokenAccount: account.type !== "Account",
});
