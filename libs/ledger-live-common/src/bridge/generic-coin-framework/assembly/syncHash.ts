import { encodeAccountId, getSyncHash } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Account, SyncConfig } from "@ledgerhq/types-live";
import { publicKeyAccountIdBasis } from "../publicKeyAccountIdBasis";

/** The tokens hash of the currency, versioned by the family's `syncVersion` when it declares one. */
export async function tokensSyncHash(
  currencyId: string,
  syncConfig: SyncConfig,
  bridgeApi: Pick<BridgeApi, "syncVersion">,
): Promise<string> {
  const tokensHash = await getSyncHash(currencyId, syncConfig.blacklistedTokenIds);
  return bridgeApi.syncVersion ? `${tokensHash}-${bridgeApi.syncVersion}` : tokensHash;
}

/** A never synced account, or one synced under another hash, is listed again from scratch. */
export function isSyncFromScratch(initial: Account | undefined, syncHash: string): boolean {
  return !initial?.blockHeight || initial.syncHash !== syncHash;
}

/** The id of an account keyed on its address, or on the public key a family keys it on. */
export function addressAccountId(
  info: AccountShapeInfo,
  bridgeApi: Pick<BridgeApi, "accountIdFromPublicKey">,
): string {
  const { currency, derivationMode, initialAccount, rest, address } = info;
  return encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    derivationMode,
    ...(bridgeApi.accountIdFromPublicKey
      ? publicKeyAccountIdBasis(initialAccount, rest?.publicKey, address)
      : { xpubOrAddress: address }),
  });
}
