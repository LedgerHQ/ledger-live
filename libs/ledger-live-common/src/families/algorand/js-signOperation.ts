import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import Algorand from "@ledgerhq/hw-app-algorand";
import { withDevice } from "../../hw/deviceAccess";
import type { AlgorandAccount, Transaction } from "./types";
import {
  buildTransactionPayload,
  encodeToSign,
  encodeToBroadcast,
} from "./buildTransaction";
import type {
  Account,
  Operation,
  SignedOperation,
  SignOperationEvent,
} from "@ledgerhq/types-live";

export const signOperation = ({
  account,
  transaction,
  deviceId,
}: {
  account: Account;
  transaction: Transaction;
  deviceId: any;
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)((transport) =>
    Observable.create((o) => {
      let cancelled;

      async function main() {
        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        const algoTx = await buildTransactionPayload(
          account as AlgorandAccount,
          transaction
        );

        const toSign = encodeToSign(algoTx);

        const hwApp = new Algorand(transport);
        const { freshAddressPath } = account;

        o.next({ type: "device-signature-requested" });

        const { signature } = await hwApp.sign(freshAddressPath, toSign);

        if (cancelled) return;

        o.next({ type: "device-signature-granted" });

        if (!signature) {
          throw new Error("No signature");
        }

        const toBroadcast = encodeToBroadcast(algoTx, signature);

        const operation = buildOptimisticOperation(
          account as AlgorandAccount,
          transaction
        );

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: toBroadcast.toString("hex"),
            expirationDate: null,
          } as SignedOperation,
        });
      }

      main().then(
        () => o.complete(),
        (e) => o.error(e)
      );

      return () => {
        cancelled = true;
      };
    })
  );

const buildOptimisticOperation = (
  account: AlgorandAccount,
  transaction: Transaction
): Operation => {
  const { spendableBalance, id, freshAddress, subAccounts } = account;

  const senders = [freshAddress];
  const recipients = [transaction.recipient];
  const { subAccountId, fees } = transaction;

  if (!fees) {
    throw new FeeNotLoaded();
  }

  const value = subAccountId
    ? fees
    : transaction.useAllAmount
    ? spendableBalance
    : transaction.amount.plus(fees);

  const type = subAccountId
    ? "FEES"
    : transaction.mode === "optIn"
    ? "OPT_IN"
    : "OUT";

  const op: Operation = {
    id: `${id}--${type}`,
    hash: "",
    type,
    value,
    fee: fees,
    blockHash: null,
    blockHeight: null,
    senders,
    recipients,
    accountId: id,
    date: new Date(),
    extra: {},
  };

  const tokenAccount = !subAccountId
    ? null
    : subAccounts && subAccounts.find((ta) => ta.id === subAccountId);

  if (tokenAccount && subAccountId) {
    op.subOperations = [
      {
        id: `${subAccountId}--OUT`,
        hash: "",
        type: "OUT",
        value: transaction.useAllAmount
          ? tokenAccount.balance
          : transaction.amount,
        fee: new BigNumber(0),
        blockHash: null,
        blockHeight: null,
        senders,
        recipients,
        accountId: subAccountId,
        date: new Date(),
        extra: {},
      },
    ];
  }

  return op;
};

export default signOperation;
