import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AssetStatus } from "@domain/entity-account-status";
import { heldTokenAssetStatus } from "../../account/accountStatus";

/** A Stellar asset the account does not hold needs a trustline, as the add-asset flows offer it. */
export default function stellarAssetStatus(account: Account, token: TokenCurrency): AssetStatus {
  return heldTokenAssetStatus(account, token, "trustline");
}
