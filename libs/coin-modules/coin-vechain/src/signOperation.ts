import { Observable } from "rxjs";
import { Transaction as ThorTransaction } from "thor-devkit";
import type { Account, AccountBridge, DeviceId, SignOperationEvent } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { buildOptimisticOperation } from "./buildOptimisticOperatioin";
import type { Transaction } from "./types";
import { VechainSigner, VechainSignature } from "./signer";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (signerContext: SignerContext<VechainSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({
    account,
    transaction,
    deviceId,
  }: {
    account: Account;
    transaction: Transaction;
    deviceId: DeviceId;
  }): Observable<SignOperationEvent> =>
    new Observable(o => {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      async function main() {
        const unsigned = new ThorTransaction(transaction.body);

        o.next({
          type: "device-signature-requested",
        });

        const signature = (await signerContext(deviceId, signer =>
          signer.signTransaction(account.freshAddressPath, unsigned.encode().toString("hex")),
        )) as VechainSignature;

        o.next({ type: "device-signature-granted" });

        const operation = await buildOptimisticOperation(account, transaction);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: signature.toString("hex"),
            rawData: transaction,
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
