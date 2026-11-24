import type { Account } from "@ledgerhq/types-live";
import type {
  AccountStatus,
  AssetActivationMethod,
  AssetStatus,
} from "@domain/entity-account-status";
import type { TokenCurrency } from "@domain/entity-currency-token";

/** Scan's `Account.used`, with no gate: `Account.readiness` does not block a send (a Tezos send reveals the account). */
export function defaultAccountStatus(account: Account): AccountStatus {
  return { used: account.used, gate: null };
}

/** Activated once the account holds the token, as the Stellar and Algorand add-asset selectors decide from `subAccounts`. */
export function heldTokenAssetStatus(
  account: Account,
  token: TokenCurrency,
  method: AssetActivationMethod,
): AssetStatus {
  const isHeld = account.subAccounts?.some(sub => sub.token.id === token.id);
  return { gate: isHeld ? null : { type: "activation", method } };
}
