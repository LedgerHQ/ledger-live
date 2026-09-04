import { log } from "@ledgerhq/logs";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import { ZCASH_LOG_TYPE } from "../constants";
import type { BtcOperationExtra, Transaction, ZcashAccount } from "../types/bridge";
import { getWalletAccount } from "./getWalletAccount";
import { broadcast as broadcastLogic } from "../logic/transaction/broadcast";
import { releaseReservation } from "./note-reservation";

/**
 * Every Zcash send (including t→t) is broadcast over the Zaino gRPC endpoint
 * -- coin-zcash never falls back to the standard explorer broadcast.
 * `signedOperation.signature` is the finalized V5 tx hex produced by
 * `bridge/signOperation.ts` (via `logic/transaction/combine.ts`).
 *
 * What the bridge adds is the context for the double-spend guard that
 * `logic/transaction/broadcast.ts` runs: the outpoints the signing recorded on
 * the operation, and the account's explorer to check them against.
 *
 * A send that does not reach the network cannot spend the notes signing reserved
 * for it, and the user is expected to retry with those very notes, so a failure
 * hands them back instead of waiting for the reservation to age out.
 */
export const broadcast: AccountBridge<Transaction, ZcashAccount>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation },
}) => {
  const inputRefs = (operation.extra as BtcOperationExtra | undefined)?.inputRefs ?? [];

  let txid: string;
  try {
    txid = await broadcastLogic(
      signature,
      inputRefs.length > 0
        ? {
            inputRefs,
            fetchUtxoTx: hash => getWalletAccount(account).xpub.explorer.fetchUtxoTx(hash),
          }
        : undefined,
    );
  } catch (error) {
    log(ZCASH_LOG_TYPE, "released note reservation after broadcast failure", {
      accountId: account.id,
      operationHash: operation.hash,
    });
    releaseReservation(account.id, operation.hash);
    throw error;
  }

  return patchOperationWithHash(operation, txid);
};
