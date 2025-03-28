import { Account as WalletAPIAccount } from "@ledgerhq/wallet-api-core";
import { WALLET_API_VERSION } from "../../wallet-api/constants";
import { TokenAccount, Account, AccountLike } from "@ledgerhq/types-live";
import { LiveAppManifest } from "../types";
import semver from "semver";

/** The dapp connector "v3" uses the ledger live account ID to find the correct account. Live app and dapp browser manifests require wallet API ID.   */
export function deriveAccountIdForManifest(
  accountId: Account["id"] | TokenAccount["id"] | AccountLike["id"],
  walletApiAccountId: WalletAPIAccount["id"] | string,
  manifest: LiveAppManifest,
) {
  const isDapp = "dapp" in manifest;
  if (isDapp && manifest.apiVersion && semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)) {
    return accountId;
  }
  /** Assume dapp browser <=v2 or live app, fallback to wallet ID.   */
  return walletApiAccountId;
}
