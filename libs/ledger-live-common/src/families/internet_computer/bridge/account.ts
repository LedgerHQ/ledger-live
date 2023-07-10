import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import {
  Account,
  AccountBridge,
  AccountLike,
  BroadcastFnSignature,
  Operation,
  SignOperationEvent,
  SignOperationFnSignature,
} from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "../types";
import { getAccountShape } from "./bridgeHelpers/account";
import BigNumber from "bignumber.js";
import { getEstimatedFees } from "./bridgeHelpers/fee";
import { getAddress, validateAddress, validateMemo } from "./bridgeHelpers/addresses";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { Observable } from "rxjs";
import { withDevice } from "../../../hw/deviceAccess";
import { encodeOperationId } from "../../../operation";
import {
  broadcastTxn,
  getTxnExpirationDate,
  getTxnMetadata,
  getUnsignedTransaction,
  signICPTransaction,
} from "./bridgeHelpers/icpRosetta";
import { getPath } from "../utils";
import { InvalidMemoICP } from "../errors";

const sync = makeSync({ getAccountShape });

const createTransaction = (): Transaction => {
  // log("debug", "[createTransaction] creating base tx");
  return {
    family: "internet_computer",
    amount: new BigNumber(0),
    fees: getEstimatedFees(),
    recipient: "",
    useAllAmount: false,
  };
};

const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  // log("debug", "[prepareTransaction] start fn");

  const { address } = getAddress(a);
  const { recipient } = t;

  let amount: BigNumber = t.amount;
  if (recipient && address) {
    // log("debug", "[prepareTransaction] fetching estimated fees");

    if ((await validateAddress(recipient)).isValid && (await validateAddress(address)).isValid) {
      if (t.useAllAmount) {
        amount = a.spendableBalance.minus(t.fees);
        return { ...t, amount };
      }
    }
  }

  // log("debug", "[prepareTransaction] finish fn");
  return t;
};

const getTransactionStatus = async (a: Account, t: Transaction): Promise<TransactionStatus> => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance } = a;
  const { address } = getAddress(a);
  const { recipient, useAllAmount } = t;
  let { amount } = t;

  if (!recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!(await validateAddress(recipient)).isValid) {
    errors.recipient = new InvalidAddress();
  } else if (recipient.toLowerCase() === address.toLowerCase()) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!(await validateAddress(address)).isValid) {
    errors.sender = new InvalidAddress();
  }

  if (!validateMemo(t.memo).isValid) {
    errors.transaction = new InvalidMemoICP();
  }

  // This is the worst case scenario (the tx won't cost more than this value)
  const estimatedFees = t.fees;

  let totalSpent: BigNumber;

  if (useAllAmount) {
    totalSpent = a.spendableBalance;
    amount = totalSpent.minus(estimatedFees);
    if (amount.lte(0) || totalSpent.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    totalSpent = amount.plus(estimatedFees);
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    } else if (totalSpent.gt(a.spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  // log("debug", "[getTransactionStatus] finish fn");

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

const estimateMaxSpendable = async ({
  account,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const balance = account.balance;

  let maxSpendable = balance.minus(transaction?.fees ?? getEstimatedFees());

  if (maxSpendable.isLessThan(0)) {
    maxSpendable = new BigNumber(0);
  }

  return maxSpendable;
};

const signOperation: SignOperationFnSignature<Transaction> = ({
  account,
  deviceId,
  transaction,
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          // log("debug", "[signOperation] start fn");

          const { recipient, amount } = transaction;
          const { id: accountId, xpub } = account;
          const { address, derivationPath } = getAddress(account);
          const fee = transaction.fees;

          const { unsignedTxn, payloads } = await getUnsignedTransaction(transaction, account);

          o.next({
            type: "device-signature-requested",
          });

          const { signedTxn } = await signICPTransaction({
            unsignedTxn,
            transport,
            path: getPath(derivationPath),
            payloads,
            pubkey: xpub ?? "",
          });

          const { hash } = await getTxnMetadata(signedTxn);

          o.next({
            type: "device-signature-granted",
          });

          const operation: Operation = {
            id: encodeOperationId(accountId, hash, "OUT"),
            hash,
            type: "OUT",
            senders: [address],
            recipients: [recipient],
            accountId,
            value: amount.plus(fee),
            fee,
            blockHash: null,
            blockHeight: null,
            date: new Date(),
            extra: {
              memo: transaction.memo,
            },
          };

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: signedTxn,
              expirationDate: getTxnExpirationDate(unsignedTxn),
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );

const receive = makeAccountBridgeReceive();

const broadcast: BroadcastFnSignature = async ({ signedOperation: { signature, operation } }) => {
  // log("debug", "[broadcast] start fn");

  await broadcastTxn(signature);

  const result = { ...operation };

  return result;
};

export const accountBridge: AccountBridge<Transaction> = {
  sync,
  updateTransaction: defaultUpdateTransaction,
  createTransaction,
  prepareTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  receive,
  signOperation,
  broadcast,
};
