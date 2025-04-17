import {
  NotEnoughBalance,
  NotEnoughToStake,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalanceFees,
} from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionStatus } from "../types";
import { getTokenAccount } from "./logic";
import {
  APTOS_DELEGATION_RESERVE_IN_OCTAS,
  MIN_COINS_ON_SHARES_POOL,
  MIN_COINS_ON_SHARES_POOL_IN_OCTAS,
} from "../constants";

const getTransactionStatus = async (a: Account, t: Transaction): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};
  const warnings = {};

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  }

  if (!AccountAddress.isValid({ input: t.recipient }).valid && !errors.recipient) {
    errors.recipient = new InvalidAddress("", { currencyName: a.currency.name });
  }

  if (t.recipient === a.freshAddress && !errors.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = t.fees || BigNumber(0);

  if (!t.useAllAmount && t.amount.lte(0)) {
    errors.amount = new AmountRequired();
  }

  const tokenAccount = getTokenAccount(a, t);

  if (tokenAccount && t.errors?.maxGasAmount == "GasInsufficientBalance" && !errors.amount) {
    errors.amount = new NotEnoughBalanceFees();
  }

  if (t.amount.gt(a.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (
    !t.useAllAmount &&
    t.stake &&
    t.stake.op === "add" &&
    t.amount.lt(MIN_COINS_ON_SHARES_POOL_IN_OCTAS)
  ) {
    errors.amount = new NotEnoughToStake("", {
      minStake: MIN_COINS_ON_SHARES_POOL,
      currency: a.currency.ticker,
    });
  }

  const amount = t.useAllAmount
    ? tokenAccount
      ? tokenAccount.spendableBalance
      : a.spendableBalance.minus(estimatedFees).isLessThan(0)
        ? BigNumber(0)
        : t.stake
          ? a.spendableBalance.minus(estimatedFees).minus(APTOS_DELEGATION_RESERVE_IN_OCTAS)
          : a.spendableBalance.minus(estimatedFees)
    : t.amount;

  const totalSpent = tokenAccount ? amount : amount.plus(estimatedFees);

  if (
    tokenAccount
      ? tokenAccount.spendableBalance.isLessThan(totalSpent) ||
        a.spendableBalance.isLessThan(estimatedFees)
      : a.spendableBalance.isLessThan(totalSpent) && !errors.amount
  ) {
    errors.amount = new NotEnoughBalance();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

export default getTransactionStatus;
