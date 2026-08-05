import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { BtcOperationExtra, Transaction, ZcashAccount } from "../types/bridge";
import { getWalletAccount } from "./getWalletAccount";
import { broadcast as broadcastLogic } from "../logic/transaction/broadcast";

/**
 * Every Zcash send (including t→t) is broadcast over the Zaino gRPC endpoint
 * -- coin-zcash never falls back to the standard explorer broadcast.
 * `signedOperation.signature` is the finalized V5 tx hex produced by
 * `bridge/signOperation.ts` (via `logic/transaction/combine.ts`).
 *
 * What the bridge adds is the context for the double-spend guard that
 * `logic/transaction/broadcast.ts` runs: the outpoints the signing recorded on
 * the operation, and the account's explorer to check them against.
 */
export const broadcast: AccountBridge<Transaction, ZcashAccount>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation },
}) => {
  const inputRefs = (operation.extra as BtcOperationExtra | undefined)?.inputRefs ?? [];

  const txid = await broadcastLogic(
    signature,
    inputRefs.length > 0
      ? {
          inputRefs,
          fetchUtxoTx: hash => getWalletAccount(account).xpub.explorer.fetchUtxoTx(hash),
        }
      : undefined,
  );

  return patchOperationWithHash(operation, txid);
};
