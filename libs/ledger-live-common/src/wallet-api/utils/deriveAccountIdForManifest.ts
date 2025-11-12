import { Account as WalletAPIAccount } from "@ledgerhq/wallet-api-core";
import { WALLET_API_VERSION } from "../../wallet-api/constants";
import { TokenAccount, Account, AccountLike } from "@ledgerhq/types-live";
import { LiveAppManifest } from "../../platform/types";
import semver from "semver";

/**
 * Determines if a manifest uses uuid (Ledger Live) account ID format or encoded (Wallet API) format.
 * @param manifest - The live app manifest to check
 * @returns true if the manifest uses encoded format (v3+ dapp), false otherwise
 */
export function usesEncodedAccountIdFormat(manifest: LiveAppManifest): boolean {
  return (
    "dapp" in manifest &&
    !!manifest.apiVersion &&
    semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)
  );
}

/** The dapp connector "v3" uses the ledger live account ID to find the correct account. Live app and dapp browser manifests require wallet API ID.   */
export function deriveAccountIdForManifest(
  accountId: Account["id"] | TokenAccount["id"] | AccountLike["id"],
  walletApiAccountId: WalletAPIAccount["id"] | string,
  manifest: LiveAppManifest,
) {
  if (usesEncodedAccountIdFormat(manifest)) {
    return accountId;
  }
  /** Assume dapp browser <=v2 or live app, fallback to wallet ID.   */
  return walletApiAccountId;
}
