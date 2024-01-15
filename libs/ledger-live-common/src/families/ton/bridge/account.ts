import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import {
  Account,
  AccountBridge,
  AccountLike,
  BroadcastFnSignature,
  SignOperationEvent,
  SignOperationFnSignature,
} from "@ledgerhq/types-live";
import { TonTransport } from "@ton-community/ton-ledger";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { getMainAccount } from "../../../account/helpers";
import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import { withDevice } from "../../../hw/deviceAccess";
import { TonCommentInvalid } from "../errors";
import { TonOperation, Transaction, TransactionStatus } from "../types";
import {
  addressesAreEqual,
  commentIsValid,
  getAddress,
  getLedgerTonPath,
  getTonEstimatedFees,
  isAddressValid,
  packTransaction,
  transactionToHwParams,
} from "../utils";
import { getAccountShape } from "./bridgeHelpers/accountShape";
import { broadcastTx, fetchAccountInfo } from "./bridgeHelpers/api";

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount);
  let balance = a.spendableBalance;

  if (balance.eq(0)) return balance;

  const accountInfo = await fetchAccountInfo(getAddress(a).address);
  const estimatedFees = transaction
    ? transaction.fees ??
      (await getTonEstimatedFees(
        a,
        accountInfo.status === "uninit",
        transactionToHwParams(transaction, accountInfo.seqno),
      ))
    : BigNumber(0);

  if (balance.lte(estimatedFees)) return new BigNumber(0);

  balance = balance.minus(estimatedFees);

  return balance;
};

const createTransaction = (): Transaction => {
  return {
    family: "ton",
    amount: new BigNumber(0),
    fees: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    comment: {
      isEncrypted: false,
      text: "",
    },
  };
};

const getTransactionStatus = async (a: Account, t: Transaction): Promise<TransactionStatus> => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance, spendableBalance } = a;
  const { address } = getAddress(a);
  const { recipient, useAllAmount } = t;
  let { amount } = t;

  if (!recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isAddressValid(recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  } else if (addressesAreEqual(address, recipient)) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!isAddressValid(address)) {
    errors.sender = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  }

  const estimatedFees = t.fees;

  let totalSpent = BigNumber(0);

  if (useAllAmount) {
    totalSpent = spendableBalance;
    amount = totalSpent.minus(estimatedFees);
    if (amount.lte(0) || totalSpent.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    totalSpent = amount.plus(estimatedFees);
    if (totalSpent.gt(spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    }
  }

  if (t.comment.isEncrypted || !commentIsValid(t.comment)) {
    errors.comment = new TonCommentInvalid();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  const accountInfo = await fetchAccountInfo(getAddress(a).address);
  const fees = await getTonEstimatedFees(
    a,
    accountInfo.status === "uninit",
    transactionToHwParams(t, accountInfo.seqno),
  );

  const amount = t.useAllAmount ? a.spendableBalance.minus(t.fees) : t.amount;

  return defaultUpdateTransaction(t, { fees, amount });
};

const sync = makeSync({
  getAccountShape,
  postSync: (_, a) => {
    const operations = a.operations || [];
    const initialPendingOps = a.pendingOperations || [];
    const pendingOperations = initialPendingOps.filter(
      pOp => !operations.some(o => o.id === pOp.id),
    );
    return { ...a, pendingOperations };
  },
});

const receive = makeAccountBridgeReceive();

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

          const { recipient, amount, fees, comment } = transaction;
          const { address, derivationPath } = getAddress(account);
          const accountInfo = await fetchAccountInfo(address);

          const app = new TonTransport(transport);

          o.next({
            type: "device-signature-requested",
          });

          // Sign by device
          // it already verifies the signature inside
          const sig = await app.signTransaction(
            getLedgerTonPath(derivationPath),
            transactionToHwParams(transaction, accountInfo.seqno),
          );

          o.next({
            type: "device-signature-granted",
          });

          const signature = packTransaction(account, accountInfo.status === "uninit", sig);
          const hash = sig.hash().toString("hex");

          const operation: TonOperation = {
            // we'll patch operation when broadcasting
            id: hash,
            hash,
            type: "OUT",
            senders: [address],
            recipients: [recipient],
            accountId: account.id,
            value: amount.plus(fees),
            fee: fees,
            blockHash: null,
            blockHeight: null,
            date: new Date(),
            extra: {
              // we don't know yet, will be patched in final operation
              lt: "",
              explorerHash: "",
              comment: comment,
            },
          };

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature,
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );

const broadcast: BroadcastFnSignature = async ({ signedOperation: { signature, operation } }) => {
  const hash = await broadcastTx(signature);
  return patchOperationWithHash(operation, hash);
};

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast,
};

export { accountBridge };
