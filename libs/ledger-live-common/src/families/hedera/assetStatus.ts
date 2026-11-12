import type { HederaAccount } from "@ledgerhq/coin-hedera/types";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AssetStatus } from "@domain/entity-account-status";
import { isTokenAssociationRequired } from "./utils";

/** The receive-with-association condition of the desktop and mobile Hedera receive flows. */
export default function hederaAssetStatus(
  account: HederaAccount,
  token: TokenCurrency,
): AssetStatus {
  return {
    assetGate: isTokenAssociationRequired(account, token)
      ? { type: "activation", method: "association" }
      : null,
  };
}
