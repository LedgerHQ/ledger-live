import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";

/** An XRP token needs a trust line first: sync then gives its token account `xrpResources`. */
export default function xrpAssetActivation(account: Account, token: TokenCurrency): boolean {
  return !account.subAccounts?.some(
    sub => sub.token.id === token.id && "xrpResources" in sub && !!sub.xrpResources,
  );
}
