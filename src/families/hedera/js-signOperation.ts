import { Observable } from "rxjs";
import { Account, DeviceId, Operation, SignOperationEvent } from "../../types";
import { Transaction } from "./types";
import { open, close } from "../../hw";
import { AccountId, PublicKey } from "@hashgraph/sdk";
import { buildUnsignedTransaction } from "./api/network";
import { calculateAmount } from "./utils";
import Hedera from "./hw-app-hedera";

export default function signOperation({
  account,
  transaction,
  deviceId,
}: {
  account: Account;
  transaction: Transaction;
  deviceId: DeviceId;
}): Observable<SignOperationEvent> {
  return new Observable((o) => {
    void (async function () {
      let transport;

      try {
        transport = await open(deviceId);

        o.next({
          type: "device-signature-requested",
        });

        const hederaTransaction = buildUnsignedTransaction({
          account,
          transaction,
        });

        const accountPublicKey = PublicKey.fromString(account.freshAddress);

        await hederaTransaction.signWith(
          accountPublicKey,
          async (bodyBytes) => {
            return await new Hedera(transport).signTransaction(bodyBytes);
          }
        );

        o.next({
          type: "device-signature-granted",
        });

        const operation = buildOptimisticOperation({ account, transaction });

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
      } finally {
        if (transport != null) {
          close(transport, deviceId);
        }
      }
    })();
  });
}

function buildOptimisticOperation({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Operation {
  const { amount, estimatedFees } = calculateAmount({ account, transaction });

  const operation: Operation = {
    id: `${account.id}--OUT`,
    hash: "",
    type: "OUT",
    value: amount,
    fee: estimatedFees,
    blockHash: null,
    blockHeight: null,
    senders: [account.hederaResources!.accountId.toString()],
    recipients: [AccountId.fromString(transaction.recipient).toString()],
    accountId: account.id,
    date: new Date(),
    extra: {},
  };

  return operation;
}
