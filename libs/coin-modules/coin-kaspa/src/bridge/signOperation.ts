import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { AccountBridge, SignOperationEvent } from "@ledgerhq/types-live";

import { buildTransaction } from "./buildTransaction";
import { KaspaAccount, Transaction } from "../types/bridge";
import { KaspaSigner } from "../signer";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import buildInitialOperation from "./buildInitialOperation";

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

        if (!transaction.feerate) {
          throw new FeeNotLoaded();
        }

        const tx = await buildTransaction(account, transaction);

        console.log("here", tx);

        // Sign by device
        await signerContext(deviceId, signer => signer.signTransaction(tx));

        // console.log(tx.toApiJSON());

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
