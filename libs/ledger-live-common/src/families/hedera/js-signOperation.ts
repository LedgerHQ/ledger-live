import { Observable } from "rxjs";
import { PublicKey } from "@hashgraph/sdk";
import {
  Account,
  DeviceId,
  Operation,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import { withDevice } from "../../hw/deviceAccess";
import { Transaction } from "./types";
import { buildUnsignedTransaction } from "./api/network";
import { getEstimatedFees } from "./utils";
import Hedera from "./hw-app-hedera";

const signOperation = ({
  account,
  transaction,
  deviceId,
}: {
  account: Account;
  transaction: Transaction;
  deviceId: DeviceId;
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)((transport) => {
    return new Observable((o) => {
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

          await hederaTransaction.signWith(
            accountPublicKey,
            async (bodyBytes) => {
              return await new Hedera(transport).signTransaction(bodyBytes);
            }
          );

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
              signature: Buffer.from(hederaTransaction.toBytes()).toString(
                "base64"
              ),
              expirationDate: null,
            },
          });

          o.complete();
        } catch (err) {
          o.error(err);
        }
      })();
    });
  });

async function buildOptimisticOperation({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<Operation> {
  const operation: Operation = {
    id: `${account.id}--OUT`,
    hash: "",
    type: "OUT",
    value: transaction.amount,
    fee: await getEstimatedFees(),
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress.toString()],
    recipients: [transaction.recipient],
    accountId: account.id,
    date: new Date(),
    extra: {},
  };

  return operation;
}

export default signOperation;
