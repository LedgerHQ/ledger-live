import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction, ZcashAccount } from "../types/bridge";
import { broadcast as broadcastLogic } from "../logic/transaction/broadcast";

/**
 * Every Zcash send (including t→t) is broadcast over the Zaino gRPC endpoint
 * -- coin-zcash never falls back to the standard explorer broadcast.
 * `signedOperation.signature` is the finalized V5 tx hex produced by
 * `bridge/signOperation.ts` (via `logic/transaction/combine.ts`).
 */
export const broadcast: AccountBridge<Transaction, ZcashAccount>["broadcast"] = async ({
  signedOperation: { signature, operation },
}) => {
  const txid = await broadcastLogic(signature);
  return patchOperationWithHash(operation, txid);
};
