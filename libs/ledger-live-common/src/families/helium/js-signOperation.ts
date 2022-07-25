import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";

import type { Transaction } from "./types";
import type {
  Account,
  Operation,
  OperationType,
  SignOperationEvent,
} from "../../types";

import { open, close } from "../../hw";
import { encodeOperationId } from "../../operation";
import Helium from "@ledgerhq/hw-app-helium";

import {
  buildPaymentV2Txn,
  buildStakeValidatorV1Txn,
  buildUnstakeValidatorV1Txn,
  buildTransferValidatorStakeV1Txn,
  buildBurnTransactionV1Txn,
} from "./js-buildTransaction";
import { getNonce } from "./logic";
import {
  StakeValidatorV1,
  PaymentV2,
  UnstakeValidatorV1,
  TransferValidatorStakeV1,
  TokenBurnV1,
} from "@helium/transactions";

/**
 *
 * @param account
 * @param transaction
 * @param fee
 * @returns
 */
const buildOptimisticOperation = async (
  account: Account,
  transaction: Transaction
): Promise<Operation> => {
  const fee = transaction.fees ?? new BigNumber(0);
  let type: OperationType = "OUT";
  if (transaction.model.mode === "stake") {
    type = "DELEGATE";
  } else if (transaction.model.mode === "unstake") {
    type = "UNDELEGATE";
  } else if (transaction.model.mode === "transfer") {
    type = "DELEGATE";
  } else if (transaction.model.mode === "burn") {
    type = "VOTE";
  }

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
    transactionSequenceNumber: await getNonce(
      account.freshAddress,
      account.currency
    ),
    date: new Date(),
    extra: { amount: transaction.amount },
  };

  return operation;
};

/**
 *
 * @param account
 * @param transaction
 * @returns PaymentV2 | StakeValidatorV1
 */
const buildTransaction = async (
  account: Account,
  transaction: Transaction
): Promise<
  | PaymentV2
  | StakeValidatorV1
  | UnstakeValidatorV1
  | TransferValidatorStakeV1
  | TokenBurnV1
> => {
  switch (transaction.model.mode) {
    case "send":
      return await buildPaymentV2Txn(account, transaction);
    case "stake":
      return await buildStakeValidatorV1Txn(account, transaction);
    case "unstake":
      return await buildUnstakeValidatorV1Txn(account, transaction);
    case "transfer":
      return await buildTransferValidatorStakeV1Txn(account, transaction);
    case "burn":
      return await buildBurnTransactionV1Txn(account, transaction);
    default:
      return await buildPaymentV2Txn(account, transaction);
  }
};

/**
 *
 * @param account
 * @param transaction
 * @returns PaymentV2 | StakeValidatorV1
 */
const signTransaction = async (
  accountIndex: number,
  unsigned:
    | PaymentV2
    | StakeValidatorV1
    | UnstakeValidatorV1
    | TransferValidatorStakeV1
    | TokenBurnV1,
  helium: Helium
): Promise<{
  txn:
    | PaymentV2
    | StakeValidatorV1
    | UnstakeValidatorV1
    | TransferValidatorStakeV1
    | TokenBurnV1;
  signature: any;
}> => {
  if (unsigned instanceof PaymentV2) {
    return await helium.signPaymentV2(unsigned, accountIndex);
  } else if (unsigned instanceof StakeValidatorV1) {
    return await helium.signStakeValidatorV1(unsigned, accountIndex);
  } else if (unsigned instanceof UnstakeValidatorV1) {
    return await helium.signUnstakeValidatorV1(unsigned, accountIndex);
  } else if (unsigned instanceof TransferValidatorStakeV1) {
    const oldOwnerTransferValidatorStakeV1 =
      await helium.signTransferValidatorStakeV1(unsigned, "old", accountIndex);
    return await helium.signTransferValidatorStakeV1(
      oldOwnerTransferValidatorStakeV1.txn,
      "new",
      accountIndex
    );
  } else if (unsigned instanceof TokenBurnV1) {
    return await helium.signTokenBurnV1(unsigned, accountIndex);
  } else {
    throw new Error("Unknown transaction");
  }
};

/**
 * Sign Transaction with Ledger hardware
 * @param param0
 * @returns
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
  new Observable((o) => {
    async function main() {
      const transport = await open(deviceId);
      try {
        o.next({ type: "device-signature-requested" });

        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        const unsigned = await buildTransaction(account, transaction);

        // Sign by device
        const helium = new Helium(transport);
        const { txn: signed } = await signTransaction(
          account.index,
          unsigned,
          helium
        );

        o.next({ type: "device-signature-granted" });

        const operation = await buildOptimisticOperation(account, transaction);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: signed.toString(),
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
