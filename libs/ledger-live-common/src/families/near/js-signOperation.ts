import * as nearAPI from "near-api-js";
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { Transaction } from "./types";
import type {
  Operation,
  SignOperationEvent,
  Account,
} from "@ledgerhq/types-live";
import { open, close } from "../../hw";
import { encodeOperationId } from "../../operation";
import Near from "@ledgerhq/hw-app-near";
import { buildTransaction } from "./js-buildTransaction";

const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  fee: BigNumber
): Operation => {
  let type;
  let value = new BigNumber(transaction.amount);

  switch (transaction.mode) {
    case "stake":
      type = "STAKE";
      break;
    case "unstake":
      type = "UNSTAKE";
      break;
    case "withdraw":
      type = "WITHDRAW_UNSTAKED";
      break;
    default:
      value = value.plus(fee);
      type = "OUT";
  }

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient].filter(Boolean),
    accountId: account.id,
    date: new Date(),
    extra: {},
  };

  return operation;
};

const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: Account;
  deviceId: any;
  transaction: Transaction;
}): Observable<SignOperationEvent> =>
  new Observable((o) => {
    async function main() {
      const transport = await open(deviceId);
      try {
        o.next({ type: "device-signature-requested" });

        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        const near = new Near(transport);
        const { publicKey } = await near.getAddress(account.freshAddressPath);
        const unsigned = await buildTransaction(
          account,
          transaction,
          publicKey
        );

        const response = await near.signTransaction(
          unsigned.encode(),
          account.freshAddressPath
        );
        const signedTransaction = new nearAPI.transactions.SignedTransaction({
          transaction: unsigned,
          signature: new nearAPI.transactions.Signature({
            keyType: unsigned.publicKey.keyType,
            data: response,
          }),
        });

        o.next({ type: "device-signature-granted" });

        const operation = buildOptimisticOperation(
          account,
          transaction,
          transaction.fees ?? new BigNumber(0)
        );
        const signedSerializedTx = signedTransaction.encode();

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: Buffer.from(signedSerializedTx).toString("base64"),
            expirationDate: null,
          },
        });
      } finally {
        close(transport, deviceId);
      }
    }
    main().then(
      () => o.complete(),
      (e) => o.error(e)
    );
  });

export default signOperation;
