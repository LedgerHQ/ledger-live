import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import Stellar from "@ledgerhq/hw-app-str";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { Account, Operation, SignOperationEvent } from "../../types";
import { withDevice } from "../../hw/deviceAccess";
import type { Transaction } from "./types";
import { buildTransaction } from "./js-buildTransaction";
import { fetchSequence } from "./api";

const buildOptimisticOperation = async (
  account: Account,
  transaction: Transaction
): Promise<Operation> => {
  const transactionSequenceNumber = await fetchSequence(account);
  const fees = transaction.fees ?? new BigNumber(0);
  const operation: Operation = {
    id: `${account.id}--OUT`,
    hash: "",
    type: "OUT",
    value:
      transaction.useAllAmount && transaction.networkInfo
        ? account.balance.minus(transaction.networkInfo.baseReserve).minus(fees)
        : transaction.amount.plus(fees),
    fee: fees,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient],
    accountId: account.id,
    date: new Date(),
    // FIXME: Javascript number may be not precise enough
    transactionSequenceNumber: transactionSequenceNumber?.plus(1).toNumber(),
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
        o.next({
          type: "device-signature-requested",
        });

        // Fees are loaded during prepareTransaction
        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        const unsigned = await buildTransaction(account, transaction);
        const unsignedPayload = unsigned.signatureBase();
        // Sign by device
        const hwApp = new Stellar(transport);
        const { signature } = await hwApp.signTransaction(
          account.freshAddressPath,
          unsignedPayload
        );
        unsigned.addSignature(
          account.freshAddress,
          signature.toString("base64")
        );
        o.next({
          type: "device-signature-granted",
        });
        const operation = await buildOptimisticOperation(account, transaction);
        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: unsigned.toXDR(),
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
