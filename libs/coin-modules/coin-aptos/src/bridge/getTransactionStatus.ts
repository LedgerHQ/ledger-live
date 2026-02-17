import { AccountAddress } from "@aptos-labs/ts-sdk";
import {
  NotEnoughBalance,
  NotEnoughToStake,
  UnstakeNotEnoughStakedBalanceLeft,
  RestakeNotEnoughStakedBalanceLeft,
  NotEnoughToRestake,
  NotEnoughToUnstake,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalanceFees,
} from "@ledgerhq/errors";
import { TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import {
  APTOS_DELEGATION_RESERVE_IN_OCTAS,
  APTOS_MINIMUM_RESTAKE,
  APTOS_MINIMUM_RESTAKE_IN_OCTAS,
  APTOS_PRECISION,
  MIN_AMOUNT_TO_UNSTAKE,
  MIN_AMOUNT_TO_UNSTAKE_IN_OCTAS,
  MIN_COINS_ON_SHARES_POOL,
  MIN_COINS_ON_SHARES_POOL_IN_OCTAS,
} from "../constants";
import { getStakingPosition } from "../logic/staking";
import type { AptosAccount, AptosStakingPosition, Transaction, TransactionStatus } from "../types";
import { getTokenAccount } from "./logic";

const checkSendTransaction = (
  t: Transaction,
  a: AptosAccount,
  tokenAccount: TokenAccount | undefined,
  estimatedFees: BigNumber,
  errors: Record<string, Error>,
): Record<string, Error> => {
  const newErrors = { ...errors };

  if (!t.recipient) {
    newErrors.recipient = new RecipientRequired();
  }

  if (!AccountAddress.isValid({ input: t.recipient }).valid && !newErrors.recipient) {
    newErrors.recipient = new InvalidAddress("", { currencyName: a.currency.name });
  }

  if (t.recipient === a.freshAddress && !newErrors.recipient) {
    newErrors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (t.amount.gt(a.balance) && !newErrors.amount) {
    newErrors.amount = new NotEnoughBalance();
  }

  if (tokenAccount && t.errors?.maxGasAmount === "GasInsufficientBalance" && !newErrors.amount) {
    newErrors.amount = new NotEnoughBalanceFees();
  }

  if (
    (tokenAccount
      ? tokenAccount.spendableBalance.isLessThan(t.amount) ||
        a.spendableBalance.isLessThan(estimatedFees)
      : a.spendableBalance.isLessThan(t.amount.plus(estimatedFees))) &&
    !newErrors.amount
  ) {
    newErrors.amount = new NotEnoughBalance();
  }

  return newErrors;
};

const checkStakeTransaction = (
  t: Transaction,
  stakingPosition: AptosStakingPosition | undefined,
  a: AptosAccount,
  errors: Record<string, Error>,
): Record<string, Error> => {
  const newErrors = { ...errors };

  if (t.amount.gt(a.spendableBalance)) {
    newErrors.amount = new NotEnoughBalance();
  }

  if (
    (((!stakingPosition || stakingPosition?.active.isZero()) &&
      ((!t.useAllAmount && t.amount.lt(MIN_COINS_ON_SHARES_POOL_IN_OCTAS)) ||
        (t.useAllAmount &&
          a.spendableBalance
            .minus(APTOS_DELEGATION_RESERVE_IN_OCTAS)
            .lt(MIN_COINS_ON_SHARES_POOL_IN_OCTAS)))) ||
      (stakingPosition &&
        !stakingPosition.active.isZero() &&
        t.amount.lt(APTOS_MINIMUM_RESTAKE_IN_OCTAS))) &&
    !newErrors.amount
  ) {
    newErrors.amount = new NotEnoughToStake("", {
      minStake:
        stakingPosition && !stakingPosition.active.isZero()
          ? APTOS_MINIMUM_RESTAKE
          : MIN_COINS_ON_SHARES_POOL,
      currency: a.currency.ticker,
    });
  }

  return newErrors;
};

const checkRestakeTransaction = (
  t: Transaction,
  stakingPosition: AptosStakingPosition | undefined,
  errors: Record<string, Error>,
): Record<string, Error> => {
  const newErrors = { ...errors };

  if (!stakingPosition) {
    newErrors.recipient = new RecipientRequired();
  } else {
    if ((t.amount.gt(stakingPosition.pendingInactive) || t.amount.isZero()) && !newErrors.amount) {
      newErrors.amount = new NotEnoughBalance();
    }
    if (!t.useAllAmount && t.amount.lt(MIN_COINS_ON_SHARES_POOL_IN_OCTAS) && !newErrors.amount) {
      newErrors.amount = new NotEnoughToRestake("", {
        minAmount: `${MIN_COINS_ON_SHARES_POOL.toNumber().toString()} APT`,
      });
    }
    if (
      !t.useAllAmount &&
      stakingPosition.pendingInactive.minus(t.amount).lt(MIN_COINS_ON_SHARES_POOL_IN_OCTAS) &&
      !newErrors.amount
    ) {
      newErrors.amount = new RestakeNotEnoughStakedBalanceLeft("", {
        maxAmount: `${stakingPosition.pendingInactive.minus(MIN_COINS_ON_SHARES_POOL_IN_OCTAS).shiftedBy(-APTOS_PRECISION).toNumber().toString()} APT`,
        totalAmount: `${stakingPosition.pendingInactive.shiftedBy(-APTOS_PRECISION).toNumber().toString()} APT`,
      });
    }
  }

  return newErrors;
};

const checkUnstakeTransaction = (
  t: Transaction,
  stakingPosition: AptosStakingPosition | undefined,
  errors: Record<string, Error>,
): Record<string, Error> => {
  const newErrors = { ...errors };

  if (!stakingPosition) {
    newErrors.recipient = new RecipientRequired();
  } else {
    if (t.amount.gt(stakingPosition.active) && !newErrors.amount) {
      newErrors.amount = new NotEnoughBalance();
    }
    if (!t.useAllAmount && t.amount.lt(MIN_AMOUNT_TO_UNSTAKE_IN_OCTAS) && !newErrors.amount) {
      newErrors.amount = new NotEnoughToUnstake("", {
        minAmount: `${MIN_AMOUNT_TO_UNSTAKE.toNumber().toString()} APT`,
      });
    }
    if (
      !t.useAllAmount &&
      stakingPosition.active.minus(t.amount).lt(MIN_AMOUNT_TO_UNSTAKE_IN_OCTAS) &&
      !newErrors.amount
    ) {
      newErrors.amount = new UnstakeNotEnoughStakedBalanceLeft("", {
        maxAmount: `${stakingPosition.active.minus(MIN_AMOUNT_TO_UNSTAKE_IN_OCTAS).shiftedBy(-APTOS_PRECISION).toNumber().toString()} APT`,
        totalAmount: `${stakingPosition.active.shiftedBy(-APTOS_PRECISION).toNumber().toString()} APT`,
      });
    }
  }

  return newErrors;
};

const checkWithdrawTransaction = (
  t: Transaction,
  stakingPosition: AptosStakingPosition | undefined,
  errors: Record<string, Error>,
) => {
  const newErrors = { ...errors };

  if (!stakingPosition) {
    newErrors.recipient = new RecipientRequired();
  } else if (t.amount.gt(stakingPosition.inactive) && !newErrors.amount) {
    newErrors.amount = new NotEnoughBalance();
  }

  return newErrors;
};

const getTransactionStatus = async (
  a: AptosAccount,
  t: Transaction,
): Promise<TransactionStatus> => {
  let errors: Record<string, Error> = {};
  const warnings = {};

  const estimatedFees = t.fees || BigNumber(0);
  const tokenAccount = getTokenAccount(a, t);

  const stakingPosition = getStakingPosition(a, t.recipient);

  if (!t.useAllAmount && t.amount.lte(0)) {
    errors.amount = new AmountRequired();
  }

  switch (t.mode) {
    case "send":
      errors = checkSendTransaction(t, a, tokenAccount, estimatedFees, errors);
      break;
    case "stake":
      errors = checkStakeTransaction(t, stakingPosition, a, errors);
      break;
    case "restake":
      errors = checkRestakeTransaction(t, stakingPosition, errors);
      break;
    case "unstake":
      errors = checkUnstakeTransaction(t, stakingPosition, errors);
      break;
    case "withdraw":
      errors = checkWithdrawTransaction(t, stakingPosition, errors);
      break;
  }

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const maxSpendable =
    t.mode === "stake"
      ? a.spendableBalance.minus(estimatedFees).minus(APTOS_DELEGATION_RESERVE_IN_OCTAS)
      : a.spendableBalance.minus(estimatedFees);

  const amount = t.useAllAmount
    ? tokenAccount
      ? tokenAccount.spendableBalance
      : a.spendableBalance.minus(estimatedFees).isLessThan(0)
        ? BigNumber(0)
        : maxSpendable
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
