import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { ElrondAccount, Transaction } from "./types";
import type {
  Account,
  Operation,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import { withDevice } from "../../hw/deviceAccess";
import { encodeOperationId } from "../../operation";
import Elrond from "./hw-app-elrond";
import { buildTransaction } from "./js-buildTransaction";
import { getNonce } from "./logic";

const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  fee: BigNumber
): Operation => {
  const type = "OUT";
  const value = transaction.useAllAmount
    ? account.balance.minus(fee)
    : new BigNumber(transaction.amount);
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
    transactionSequenceNumber: getNonce(account as ElrondAccount),
    date: new Date(),
    extra: {},
  };
  return operation;
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
        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        const elrond = new Elrond(transport);
        await elrond.setAddress(account.freshAddressPath);

        const unsigned = await buildTransaction(
          account as ElrondAccount,
          transaction
        );

        o.next({
          type: "device-signature-requested",
        });

        const r = await elrond.signTransaction(
          account.freshAddressPath,
          unsigned,
          true
        );

        o.next({
          type: "device-signature-granted",
        });

        const operation = buildOptimisticOperation(
          account,
          transaction,
          transaction.fees ?? new BigNumber(0)
        );
        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: r,
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
