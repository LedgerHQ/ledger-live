import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";

/** An ASA must be opted in first: the account then holds its token account. */
export default function algorandAssetActivation(account: Account, token: TokenCurrency): boolean {
  return !account.subAccounts?.some(sub => sub.token.id === token.id);
}
