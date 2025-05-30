import {
  NotEnoughBalance,
  NotEnoughToStake,
  NotEnoughStakedBalanceLeft,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalanceFees,
} from "@ledgerhq/errors";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { BigNumber } from "bignumber.js";
import type { AptosAccount, Transaction, TransactionStatus } from "../types";
import { getTokenAccount } from "./logic";
import {
  APTOS_DELEGATION_RESERVE_IN_OCTAS,
  MIN_COINS_ON_SHARES_POOL,
  MIN_COINS_ON_SHARES_POOL_IN_OCTAS,
} from "../constants";

const getTransactionStatus = async (
  a: AptosAccount,
  t: Transaction,
): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};
  const warnings = {};

  const estimatedFees = t.fees || BigNumber(0);
  const tokenAccount = getTokenAccount(a, t);

  const stakingPosition = (a.aptosResources?.stakingPositions ?? []).find(
    stakingPosition => stakingPosition.validatorId === t.recipient,
  );

  if (!t.useAllAmount && t.amount.lte(0)) {
    errors.amount = new AmountRequired();
  }

  switch (t.mode) {
    case "send":
      if (!t.recipient) {
        errors.recipient = new RecipientRequired();
      }

      if (!AccountAddress.isValid({ input: t.recipient }).valid && !errors.recipient) {
        errors.recipient = new InvalidAddress("", { currencyName: a.currency.name });
      }

      if (t.recipient === a.freshAddress && !errors.recipient) {
        errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
      }

      if (t.amount.gt(a.balance) && !errors.amount) {
        errors.amount = new NotEnoughBalance();
      }

      if (tokenAccount && t.errors?.maxGasAmount === "GasInsufficientBalance" && !errors.amount) {
        errors.amount = new NotEnoughBalanceFees();
      }

      if (
        (tokenAccount
          ? tokenAccount.spendableBalance.isLessThan(t.amount) ||
            a.spendableBalance.isLessThan(estimatedFees)
          : a.spendableBalance.isLessThan(t.amount.plus(estimatedFees))) &&
        !errors.amount
      ) {
        errors.amount = new NotEnoughBalance();
      }
      break;
    case "stake":
      if (t.amount.gt(a.balance)) {
        errors.amount = new NotEnoughBalance();
      }

      if (
        ((!t.useAllAmount && t.amount.lt(MIN_COINS_ON_SHARES_POOL_IN_OCTAS)) ||
          (t.useAllAmount && a.spendableBalance.lt(MIN_COINS_ON_SHARES_POOL_IN_OCTAS))) &&
        !errors.amount
      ) {
        errors.amount = new NotEnoughToStake("", {
          minStake: MIN_COINS_ON_SHARES_POOL,
          currency: a.currency.ticker,
        });
      }
      break;
    case "restake":
      if (!stakingPosition) {
        errors.recipient = new RecipientRequired();
      } else {
        if ((t.amount.gt(stakingPosition.pendingInactive) || t.amount.isZero()) && !errors.amount) {
          errors.amount = new NotEnoughBalance();
        }
        if (
          !t.useAllAmount &&
          t.amount.plus(stakingPosition.active).lt(MIN_COINS_ON_SHARES_POOL_IN_OCTAS) &&
          !errors.amount
        ) {
          errors.amount = new NotEnoughStakedBalanceLeft("", {
            minAmountStaked: `${MIN_COINS_ON_SHARES_POOL.toNumber().toString()} APT`,
          });
        }
      }
      break;
    case "unstake":
      if (!stakingPosition) {
        errors.recipient = new RecipientRequired();
      } else {
        if (t.amount.gt(stakingPosition.active) && !errors.amount) {
          errors.amount = new NotEnoughBalance();
        }
        if (
          !t.useAllAmount &&
          stakingPosition.active.minus(t.amount).lt(MIN_COINS_ON_SHARES_POOL_IN_OCTAS) &&
          !errors.amount
        ) {
          errors.amount = new NotEnoughStakedBalanceLeft("", {
            minAmountStaked: `${MIN_COINS_ON_SHARES_POOL.toNumber().toString()} APT`,
          });
        }
      }
      break;
    case "withdraw":
      if (!stakingPosition) {
        errors.recipient = new RecipientRequired();
      } else {
        if (t.amount.gt(stakingPosition.inactive) && !errors.amount) {
          errors.amount = new NotEnoughBalance();
        }
      }
      break;
  }

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const amount = t.useAllAmount
    ? tokenAccount
      ? tokenAccount.spendableBalance
      : a.spendableBalance.minus(estimatedFees).isLessThan(0)
        ? BigNumber(0)
        : t.mode === "stake"
          ? a.spendableBalance.minus(estimatedFees).minus(APTOS_DELEGATION_RESERVE_IN_OCTAS)
          : a.spendableBalance.minus(estimatedFees)
    : t.amount;

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent: tokenAccount ? amount : amount.plus(estimatedFees),
  });
};

export default getTransactionStatus;
