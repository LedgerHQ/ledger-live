import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildTransactionPayload, encodeToBroadcast, encodeToSign } from "./buildTransaction";
import type { AlgorandSigner } from "./signer";
import type { AlgorandAccount, AlgorandTransaction } from "./types";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    signerContext: SignerContext<AlgorandSigner>,
  ): AccountBridge<AlgorandTransaction, AlgorandAccount>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      let cancelled = false;

      async function main() {
        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        const algoTx = await buildTransactionPayload(account, transaction);

        const toSign = encodeToSign(algoTx);

        const { freshAddressPath } = account;

        o.next({ type: "device-signature-requested" });

        const { signature } = await signerContext(deviceId, signer =>
          signer.sign(freshAddressPath, toSign),
        );

        if (cancelled) return;

        o.next({ type: "device-signature-granted" });

        if (!signature) {
          throw new Error("No signature");
        }

        const toBroadcast = encodeToBroadcast(algoTx, signature);

        const operation = buildOptimisticOperation(account, transaction);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: toBroadcast.toString("hex"),
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );

      return () => {
        cancelled = true;
      };
    });

export default buildSignOperation;
