import type { Account } from "@ledgerhq/types-live";
import type {
  AccountStatus,
  AssetActivationMethod,
  AssetStatus,
} from "@domain/entity-account-status";
import type { TokenCurrency } from "@domain/entity-currency-token";

/** Scan's `Account.used`, and gated while `Account.readiness` is not ready, as Perps `getReadinessError` decides. */
export function defaultAccountStatus(account: Account): AccountStatus {
  return {
    exists: account.used,
    accountGate:
      account.readiness?.ready === false
        ? { type: "activation", reason: account.readiness.reason || null }
        : null,
  };
}

/** Activated once the account holds the token, as the Stellar and Algorand add-asset selectors decide from `subAccounts`. */
export function heldTokenAssetStatus(
  account: Account,
  token: TokenCurrency,
  method: AssetActivationMethod,
): AssetStatus {
  const isHeld = account.subAccounts?.some(sub => sub.token.id === token.id);
  return { assetGate: isHeld ? null : { type: "activation", method } };
}
