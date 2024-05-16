import { Observable } from "rxjs";
import Stellar from "@ledgerhq/hw-app-str";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import { withDevice } from "../../hw/deviceAccess";
import type { Transaction } from "./types";
import { buildTransaction } from "./buildTransaction";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

/**
 * Sign Transaction with Ledger hardware
 */
export const signOperation: AccountBridge<Transaction>["signOperation"] = ({
  account,
  deviceId,
  transaction,
}) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          o.next({
            type: "device-signature-requested",
          });

          // Fees are loaded during prepareTransaction
          if (!transaction.fees) {
            throw new FeeNotLoaded();
          }

          const unsigned = await buildTransaction(account, transaction);
          const unsignedPayload: Buffer = Buffer.from(unsigned.signatureBase());
          // Sign by device
          const hwApp = new Stellar(transport);
          const { signature } = await hwApp.signTransaction(
            account.freshAddressPath,
            unsignedPayload,
          );
          unsigned.addSignature(account.freshAddress, signature.toString("base64"));
          o.next({
            type: "device-signature-granted",
          });
          const operation = await buildOptimisticOperation(account, transaction);
          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: unsigned.toXDR(),
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );

export default signOperation;
