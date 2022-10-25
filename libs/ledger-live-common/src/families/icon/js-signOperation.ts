import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";

import type { IconAccount, Transaction } from "./types";
import type {
  Account,
  Operation,
  SignOperationEvent,
} from "@ledgerhq/types-live";

import { withDevice } from "../../hw/deviceAccess";
import { encodeOperationId } from "../../operation";
import Icon from "@ledgerhq/hw-app-icon";

import { buildTransaction } from "./js-buildTransaction";
import { getNonce } from "./logic";
import { STEP_LIMIT } from "./constants";

const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  fee: BigNumber
): Operation => {
  const type = "OUT";

  const value = new BigNumber(transaction.amount).plus(fee);

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
    transactionSequenceNumber: getNonce(account as IconAccount),
    date: new Date(),
    extra: { additionalField: transaction.amount },
  };

  return operation;
};

/**
 * Adds signature to unsigned transaction. Will likely be a call to Icon SDK
 */
const signTx = (rawTransaction: any, signature: any) => {
  rawTransaction.signature = signature;
  return {
    rawTransaction,
    signature,
  };
};

/**
 * Sign Transaction with Ledger hardware
 */
const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: Account;
  deviceId: any;
  transaction: Transaction;
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)((transport) =>
    Observable.create((o) => {
      async function main() {
        o.next({
          type: "device-signature-requested",
        });

        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        const { unsigned, rawTransaction } = await buildTransaction(
          account as IconAccount,
          transaction,
          new BigNumber(STEP_LIMIT)
        );

        // Sign by device
        const icon = new Icon(transport);
        const r = await icon.signTransaction(
          account.freshAddressPath,
          unsigned
        );

        const signed = signTx(rawTransaction, r.signedRawTxBase64);

        o.next({ type: "device-signature-granted" });

        const operation = buildOptimisticOperation(
          account,
          transaction,
          transaction.fees ?? new BigNumber(0)
        );

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: signed,
            expirationDate: null,
          },
        });
      }

      main().then(
        () => o.complete(),
        (e) => o.error(e)
      );
    })
  );

export default signOperation;
