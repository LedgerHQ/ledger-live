import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";

import type { IconAccount, Transaction } from "./types";
import type { Account, Operation, SignOperationEvent } from "@ledgerhq/types-live";

import { withDevice } from "../../hw/deviceAccess";
import { encodeOperationId } from "../../operation";
import Icon from "@ledgerhq/hw-app-icon";

import { buildTransaction } from "./js-buildTransaction";
import { calculateAmount, getNonce } from "./logic";
import { FeeNotLoaded } from "@ledgerhq/errors";
import IconService from "icon-sdk-js";
const { IconUtil, IconConverter } = IconService;

const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  fee: BigNumber,
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
    extra: {},
  };

  return operation;
};

/**
 * Adds signature to unsigned transaction. Will likely be a call to Icon SDK
 */
const addSignature = (rawTransaction: any, signature: any) => {
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
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          o.next({
            type: "device-signature-requested",
          });

          if (!transaction.fees) {
            throw new FeeNotLoaded();
          }
          // Ensure amount is filled when useAllAmount
          const transactionToSign = {
            ...transaction,
            amount: calculateAmount({
              a: account as IconAccount,
              t: transaction,
            }),
          };

          const { unsigned } = await buildTransaction(
            account as IconAccount,
            transactionToSign,
            transactionToSign.stepLimit,
          );

          // Sign by device
          const icon = new Icon(transport);
          const res = await icon.signTransaction(
            account.freshAddressPath,
            IconUtil.generateHashKey(IconConverter.toRawTransaction(unsigned)),
          );
          const signed = addSignature(unsigned, res.signedRawTxBase64);
          o.next({ type: "device-signature-granted" });

          const operation = buildOptimisticOperation(
            account,
            transactionToSign,
            transactionToSign.fees ?? new BigNumber(0),
          );

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: signed.signature,
              rawData: signed.rawTransaction,
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
