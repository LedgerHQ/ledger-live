import type { Account } from "@ledgerhq/types-live";
import type { XrpTokenStandard } from "@ledgerhq/coin-xrp/config";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getXrpEnabledTokenStandards } from "./config";

/** The token standards sync reads on this network: compute once, then match each token with `standardOf`. */
export function enabledXrpTokenStandards(currencyId: string): ReadonlySet<XrpTokenStandard> {
  return new Set(getXrpEnabledTokenStandards(currencyId));
}

export function standardOf(
  standards: ReadonlySet<XrpTokenStandard>,
  token: TokenCurrency,
): XrpTokenStandard | undefined {
  return [...standards].find(standard => standard === token.tokenType);
}

/** The tokens the account holds: a token account without `xrpResources` holds no trust line. */
export function heldXrpTokenIds(account: Account): ReadonlySet<string> {
  return new Set(
    (account.subAccounts ?? [])
      .filter(sub => "xrpResources" in sub && !!sub.xrpResources)
      .map(sub => sub.token.id),
  );
}

export function hasPendingXrpTokenRemoval(account: Account, token: TokenCurrency): boolean {
  return account.pendingOperations.some(operation => {
    const raw = operation.transactionRaw;
    if (operation.type !== "OPT_OUT" || !raw) return false;
    if (!("assetReference" in raw) || !("assetOwner" in raw)) return false;

    return raw.assetReference === token.tokenIdentifier && raw.assetOwner === token.contractAddress;
  });
}
