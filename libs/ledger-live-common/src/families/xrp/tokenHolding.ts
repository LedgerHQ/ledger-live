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

/** The tokens the account holds: a removed token keeps its token account, for its history, but loses its `xrpResources`. */
export function heldXrpTokenIds(account: Account): ReadonlySet<string> {
  return new Set(
    (account.subAccounts ?? [])
      .filter(sub => "xrpResources" in sub && !!sub.xrpResources)
      .map(sub => sub.token.id),
  );
}
