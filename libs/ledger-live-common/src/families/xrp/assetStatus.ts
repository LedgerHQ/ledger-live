import type { Account } from "@ledgerhq/types-live";
import type { XrpTokenStandard } from "@ledgerhq/coin-xrp/config";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AssetActivationMethod, AssetStatus } from "@domain/entity-account-status";
import { enabledXrpTokenStandards, heldXrpTokenIds, standardOf } from "./tokenHolding";

const METHOD_BY_STANDARD: Record<XrpTokenStandard, AssetActivationMethod> = {
  iou: "trustline",
  mpt: "authorize",
};

/** The add-token condition of `filterTokenOptions`: a token of an enabled standard the account does not hold; any other token has no gate, as the app offers none. */
export default function xrpAssetStatus(account: Account, token: TokenCurrency): AssetStatus {
  const standard = standardOf(enabledXrpTokenStandards(account.currency.id), token);
  if (!standard) return { gate: null };
  return {
    gate: heldXrpTokenIds(account).has(token.id)
      ? null
      : { type: "activation", method: METHOD_BY_STANDARD[standard] },
  };
}
