import {
  AmountRequired,
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
} from "@ledgerhq/errors";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { MAX_MEMO_LENGTH } from "@ledgerhq/hw-app-concordium/lib/cbor";
import { isRecipientValid } from "../logic/utils";
import coinConfig from "../config";
import { Transaction, TransactionStatus } from "../types";
import { ConcordiumInsufficientFunds, ConcordiumMemoTooLong } from "../types/errors";

function validateAmount(
  transaction: Transaction,
  account: Account,
  amount: BigNumber,
  totalSpent: BigNumber,
  reserveAmount: BigNumber,
): Error | undefined {
  if (amount.eq(0) && !transaction.useAllAmount) {
    // if the amount is 0, we prevent the user from sending the tx (even if it's technically feasible)
    // unless useAllAmount is set (which means the account has insufficient balance)
    return new AmountRequired();
  }

  if (totalSpent.gt(account.balance.minus(reserveAmount))) {
    return new ConcordiumInsufficientFunds();
  }
}

function validateFee(estimatedFees: BigNumber): Error | undefined {
  if (estimatedFees.isNaN()) {
    return new FeeNotLoaded();
  }

  if (estimatedFees.lte(0)) {
    return new FeeRequired();
  }
}

function validateMemo(memo: string): Error | undefined {
  const memoBytes = Buffer.from(memo, "utf-8").length;

  if (memoBytes > MAX_MEMO_LENGTH) {
    return new ConcordiumMemoTooLong("", {
      memoLength: memoBytes.toString(),
      maxLength: MAX_MEMO_LENGTH.toString(),
    });
  }
}

function validateRecipient(transaction: Transaction, account: Account): Error | undefined {
  if (!transaction.recipient) {
    return new RecipientRequired("");
  }

  if (transaction.recipient === account.freshAddress) {
    return new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!isRecipientValid(transaction.recipient)) {
    return new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }
}

export const getTransactionStatus: AccountBridge<
  Transaction,
  Account,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  // reserveAmount is the minimum amount of currency that an account must hold in order to stay activated
  const reserveAmount = new BigNumber(coinConfig.getCoinConfig(account.currency).minReserve);
  const estimatedFees = new BigNumber(transaction.fee || 0);

  // Calculate amount based on useAllAmount flag
  const amount = transaction.useAllAmount
    ? BigNumber.max(0, account.spendableBalance.minus(estimatedFees))
    : new BigNumber(transaction.amount);

  const totalSpent = amount.plus(estimatedFees);

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    // if the fee is more than 10 times the amount, we warn the user that fee is high compared to what he is sending
    warnings.feeTooHigh = new FeeTooHigh();
  }

  Object.assign(errors, {
    amount: validateAmount(transaction, account, amount, totalSpent, reserveAmount),
    fee: validateFee(estimatedFees),
    recipient: validateRecipient(transaction, account),
  });

  if (transaction.memo) {
    Object.assign(errors, { memo: validateMemo(transaction.memo) });
  }

  return {
    errors: Object.fromEntries(Object.entries(errors).filter(([, v]) => !!v)),
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};
