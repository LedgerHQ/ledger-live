import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, SignOperationEvent } from "@ledgerhq/types-live";
import { Observable } from "rxjs";

import { KaspaAccount, KaspaSigner, Transaction } from "../types";
import buildInitialOperation from "./buildInitialOperation";
import { buildTransaction } from "./buildTransaction";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    signerContext: SignerContext<KaspaSigner>,
  ): AccountBridge<Transaction, KaspaAccount>["signOperation"] =>
  ({ account, deviceId, transaction }): Observable<SignOperationEvent> =>
    new Observable(o => {
      async function main() {
        o.next({
          type: "device-signature-requested",
        });

        const tx = await buildTransaction(account, transaction);

        // Sign by device
        await signerContext(deviceId, signer => signer.signTransaction(tx));

        o.next({ type: "device-signature-granted" });
        const operation = buildInitialOperation(account, tx);
        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: JSON.stringify(tx.toApiJSON()),
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
