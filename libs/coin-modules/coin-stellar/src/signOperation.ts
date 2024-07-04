import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Transaction } from "./types";
import { buildTransaction } from "./buildTransaction";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { StellarSigner } from "./types/signer";

export function buildSignOperation(
  signerContext: SignerContext<StellarSigner>,
): AccountBridge<Transaction, Account>["signOperation"] {
  return function signOperation({ account, deviceId, transaction }) {
    return new Observable(obs => {
      let cancelled = false;

      async function main() {
        obs.next({ type: "device-signature-requested" });

        if (cancelled) {
          return;
        }

        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        const unsigned = await buildTransaction(account, transaction);
        const unsignedPayload: Buffer = Buffer.from(unsigned.signatureBase());
        // Sign by device
        const { signature } = await signerContext(deviceId, signer =>
          signer.signTransaction(account.freshAddressPath, unsignedPayload),
        );
        unsigned.addSignature(account.freshAddress, signature.toString("base64"));
        obs.next({
          type: "device-signature-granted",
        });
        const operation = await buildOptimisticOperation(account, transaction);
        obs.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: unsigned.toXDR(),
          },
        });
      }

      main().then(
        () => obs.complete(),
        err => obs.error(err),
      );

      return () => {
        cancelled = true;
      };
    });
  };
}
