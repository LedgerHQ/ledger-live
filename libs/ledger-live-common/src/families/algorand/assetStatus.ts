import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AssetStatus } from "@domain/entity-account-status";
import { heldTokenAssetStatus } from "../../account/accountStatus";

/** An ASA the account does not hold needs an opt-in, as the opt-in flows offer it. */
export default function algorandAssetStatus(account: Account, token: TokenCurrency): AssetStatus {
  return heldTokenAssetStatus(account, token, "optIn");
}
