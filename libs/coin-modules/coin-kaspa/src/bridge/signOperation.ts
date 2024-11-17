import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { AccountBridge, SignOperationEvent } from "@ledgerhq/types-live";

import { buildTransaction } from "./buildTransaction";
import { KaspaAccount, KaspaTransaction } from "../types/bridge";
import { KaspaSigner } from "../signer";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import buildInitialOperation from "./buildInitialOperation";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    signerContext: SignerContext<KaspaSigner>,
  ): AccountBridge<KaspaTransaction, KaspaAccount>["signOperation"] =>
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

        // Sign by device
        await signerContext(deviceId, signer => signer.signTransaction(tx));

        // console.log(tx.toApiJSON());

        o.next({ type: "device-signature-granted" });

        const operation = buildInitialOperation(account, transaction);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: tx.inputs[0].signature || "",
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
