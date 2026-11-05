import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";

/** A Stellar asset needs a trustline first: the account then holds its token account. */
export default function stellarAssetActivation(account: Account, token: TokenCurrency): boolean {
  return !account.subAccounts?.some(sub => sub.token.id === token.id);
}
