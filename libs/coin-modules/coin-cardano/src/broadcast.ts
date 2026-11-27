import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AccountBridge } from "@ledgerhq/types-live";
import { submitTransaction } from "./api/submitTransaction";
import { Transaction } from "./types";
import type { CardanoContext } from "./config";

/** Builds the bridge `broadcast`, resolving the coin config from `context` per call. */
export const buildBroadcast =
  (context: CardanoContext): AccountBridge<Transaction>["broadcast"] =>
  async ({ signedOperation, account }) => {
    const signedTx = signedOperation.signature;
    const pendingTransaction = await submitTransaction({
      transaction: signedTx,
      config: await context.config(account.currency.id),
    });

    return patchOperationWithHash(signedOperation.operation, pendingTransaction.hash);
  };
