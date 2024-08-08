import { Observable } from "rxjs";
import Vet from "@ledgerhq/hw-app-vet";
import { Transaction as ThorTransaction } from "thor-devkit";
import type { AccountBridge } from "@ledgerhq/types-live";
import { buildOptimisticOperation } from "./buildOptimisticOperatioin";
import { withDevice } from "../../hw/deviceAccess";
import type { Transaction } from "./types";

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
          const unsigned = new ThorTransaction(transaction.body);

          // Sign on device
          const vechainApp = new Vet(transport);
          o.next({
            type: "device-signature-requested",
          });
          const signature = await vechainApp.signTransaction(
            account.freshAddressPath,
            unsigned.encode().toString("hex"),
          );

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
      }),
  );

export default signOperation;
