import type { Account } from "@ledgerhq/types-live";
import type { AccountTrackingFacts } from "@features/flow-account-detail";

/** The page always shows a main account: a token account opens its parent account. */
export const getAccountTrackingFacts = (account: Account): AccountTrackingFacts => ({
  currencyId: account.currency.id,
  isTokenAccount: false,
});
