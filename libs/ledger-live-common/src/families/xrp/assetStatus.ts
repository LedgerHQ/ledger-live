import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AssetStatus } from "@domain/entity-account-status";
import { enabledXrpTokenStandards, heldXrpTokenIds, standardOf } from "./tokenHolding";

/** The add-token condition of `filterTokenOptions`: a token of an enabled standard the account does not hold; any other token has no gate, as the app offers none. */
export default function xrpAssetStatus(account: Account, token: TokenCurrency): AssetStatus {
  const standard = standardOf(enabledXrpTokenStandards(account.currency.id), token);
  if (!standard) return { gate: null };
  return { gate: heldXrpTokenIds(account).has(token.id) ? null : { type: "activation" } };
}
