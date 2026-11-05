import type { HederaAccount } from "@ledgerhq/coin-hedera/types";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { isTokenAssociationRequired } from "./utils";

/** An HTS token must be associated first, unless automatic association is on. */
export default function hederaAssetActivation(
  account: HederaAccount,
  token: TokenCurrency,
): boolean {
  return isTokenAssociationRequired(account, token);
}
