import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";

import type { Transaction, ZilliqaAccount } from "./types";
import type {
  Account,
  Operation,
  SignOperationEvent,
} from "@ledgerhq/types-live";

import { withDevice } from "../../hw/deviceAccess";
import { encodeOperationId } from "../../operation";
import Zilliqa from "@ledgerhq/hw-app-zilliqa";

import { buildTransaction } from "./js-buildTransaction";
import { getNonce } from "./logic";

const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  fee: BigNumber
): Operation => {
  const type = "OUT";

  const value = BigNumber(transaction.amount).plus(fee);

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee,
    blockHash: null,
    blockHeight: account.blockHeight,
    senders: [account.freshAddress],
    recipients: [transaction.recipient].filter(Boolean),
    accountId: account.id,
    transactionSequenceNumber: getNonce(account as ZilliqaAccount),
    date: new Date(),
    extra: {},
  };

  return operation;
};

/**
 * Adds signature to unsigned transaction. Will likely be a call to Zilliqa SDK
 */
const signTx = (unsigned: string, signature: any) => {
  return `${unsigned}:${signature}`;
};

/**
 * Sign Transaction with Ledger hardware
 */
const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: ZilliqaAccount;
  deviceId: any;
  transaction: Transaction;
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)((transport) =>
    Observable.create((o) => {
      async function main() {
        o.next({
          type: "device-signature-requested",
        });

        if (!transaction.gasLimit || !transaction.gasPrice) {
          throw new FeeNotLoaded();
        }

        // Creating unsigned transaction
        const unsigned = await buildTransaction(account, transaction);

        // Sign by device
        const zilliqa = new Zilliqa(transport);
        const r = await zilliqa.signTransaction(
          account.freshAddressPath,
          unsigned
        );

        const signed = signTx(unsigned, r.signature);

        o.next({ type: "device-signature-granted" });

        const { gasPrice, gasLimit } = transaction;
        const fee = new BigNumber(gasPrice.mul(gasLimit).toString());
        const operation = buildOptimisticOperation(account, transaction, fee);

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
