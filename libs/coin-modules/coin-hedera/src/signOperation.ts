import { Observable } from "rxjs";
import { PublicKey } from "@hashgraph/sdk";
import { AccountBridge } from "@ledgerhq/types-live";
import { withDevice } from "../../hw/deviceAccess";
import { Transaction } from "./types";
import Hedera from "./hw-app-hedera";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildUnsignedTransaction } from "./api/network";

export const signOperation: AccountBridge<Transaction>["signOperation"] = ({
  account,
  transaction,
  deviceId,
}) =>
  withDevice(deviceId)(transport => {
    return new Observable(o => {
      void (async function () {
        try {
          o.next({
            type: "device-signature-requested",
          });

          const hederaTransaction = await buildUnsignedTransaction({
            account,
            transaction,
          });

          const accountPublicKey = PublicKey.fromString(account.seedIdentifier);

          await hederaTransaction.signWith(accountPublicKey, async bodyBytes => {
            return await new Hedera(transport).signTransaction(bodyBytes);
          });

          o.next({
            type: "device-signature-granted",
          });

          const operation = await buildOptimisticOperation({
            account,
            transaction,
          });

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              // NOTE: this needs to match the inverse operation in js-broadcast
              signature: Buffer.from(hederaTransaction.toBytes()).toString("base64"),
            },
          });

          o.complete();
        } catch (err) {
          o.error(err);
        }
      })();
    });
  });

export default signOperation;
