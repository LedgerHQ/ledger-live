import { BigNumber } from "bignumber.js";
import { utils } from "near-api-js";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import {
  NearMappedStakingPosition,
  Transaction,
  NearStakingPosition,
  NearValidatorItem,
  NearAccount,
} from "./types";
import { createTransaction } from "./createTransaction";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getCurrentNearPreloadData } from "./preload";
import { FRACTIONAL_DIGITS, STAKING_GAS_BASE, YOCTO_THRESHOLD_VARIATION } from "./constants";

export const isValidAddress = (address: string): boolean => {
  const readableAddressRegex = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
  const hexAddressRegex = /^[a-f0-9]{64}$/;

  if (isImplicitAccount(address)) {
    return hexAddressRegex.test(address);
  }

  return readableAddressRegex.test(address);
};

export const isImplicitAccount = (address: string): boolean => {
  return !address.includes(".");
};

export const getStakingGas = (t?: Transaction, multiplier = 5): BigNumber => {
  const stakingGasBase = new BigNumber(STAKING_GAS_BASE);

  if (t?.mode === "withdraw" && t?.useAllAmount) {
    multiplier = 7;
  }

  return stakingGasBase.multipliedBy(multiplier);
};

/*
 * Get the max amount that can be spent, taking into account tx type and pending operations.
 */
export const getMaxAmount = (
  account: NearAccount,
  transaction: Transaction,
  fees?: BigNumber,
): BigNumber => {
  let maxAmount;
  const selectedValidator = account.nearResources?.stakingPositions.find(
    ({ validatorId }) => validatorId === transaction.recipient,
  );

  let pendingUnstakingAmount = new BigNumber(0);
  let pendingWithdrawingAmount = new BigNumber(0);
  let pendingDefaultAmount = new BigNumber(0);

  account.pendingOperations.forEach(({ type, value, recipients }) => {
    const recipient = recipients[0];

    if (type === "UNSTAKE" && recipient === selectedValidator?.validatorId) {
      pendingUnstakingAmount = pendingUnstakingAmount.plus(value);
    } else if (type === "WITHDRAW_UNSTAKED" && recipient === selectedValidator?.validatorId) {
      pendingWithdrawingAmount = pendingWithdrawingAmount.plus(value);
    } else {
      pendingDefaultAmount = pendingDefaultAmount.plus(value);
    }
  });

  switch (transaction.mode) {
    case "unstake":
      maxAmount = selectedValidator?.staked.minus(pendingUnstakingAmount);
      break;
    case "withdraw":
      maxAmount = selectedValidator?.available.minus(pendingWithdrawingAmount);
      break;
    default:
      maxAmount = account.spendableBalance.minus(pendingDefaultAmount);

      if (fees) {
        maxAmount = maxAmount.minus(fees);
      }
  }

  if (maxAmount === undefined || maxAmount.lt(0)) {
    return new BigNumber(0);
  }

  return maxAmount;
};

export const getTotalSpent = (a: NearAccount, t: Transaction, fees: BigNumber): BigNumber => {
  if (["unstake", "withdraw"].includes(t.mode)) {
    return fees;
  }

  if (t.useAllAmount) {
    return a.spendableBalance;
  }

  return new BigNumber(t.amount).plus(fees);
};

export const mapStakingPositions = (
  stakingPositions: NearStakingPosition[],
  validators: NearValidatorItem[],
  unit: Unit,
): NearMappedStakingPosition[] => {
  return stakingPositions.map(sp => {
    const rank = validators.findIndex(v => v.validatorAddress === sp.validatorId);
    const validator = validators[rank] ?? sp;
    const formatConfig = {
      disableRounding: false,
      alwaysShowSign: false,
      showCode: true,
    };

    return {
      ...sp,
      formattedAmount: formatCurrencyUnit(unit, sp.staked, formatConfig),
      formattedPending: formatCurrencyUnit(unit, sp.pending, formatConfig),
      formattedAvailable: formatCurrencyUnit(unit, sp.available, formatConfig),
      rank,
      validator,
    };
  });
};

/*
 * Make sure that an account has enough funds to stake, unstake, AND withdraw before staking.
 */
export const canStake = (account: NearAccount): boolean => {
  let transaction = createTransaction(account);
  transaction = updateTransaction(transaction, {
    mode: "stake",
  });

  const { gasPrice } = getCurrentNearPreloadData();

  const fees = getStakingFees(transaction, gasPrice).multipliedBy(3);

  return getMaxAmount(account, transaction, fees).gt(0);
};

export const canUnstake = (
  stakingPosition: NearMappedStakingPosition | NearStakingPosition,
): boolean => {
  return stakingPosition.staked.gte(getYoctoThreshold());
};

export const canWithdraw = (
  stakingPosition: NearMappedStakingPosition | NearStakingPosition,
): boolean => {
  return stakingPosition.available.gte(getYoctoThreshold());
};

/*
 * The threshold that the NEAR wallet uses for staking, unstaking, and withdrawing.
 * A "1" is subtracted due to the value from the node being 1 yoctoNEAR less than what was staked.
 */
export const getYoctoThreshold = (): BigNumber => {
  return new BigNumber(10)
    .pow(new BigNumber(utils.format.NEAR_NOMINATION_EXP - FRACTIONAL_DIGITS))
    .minus(YOCTO_THRESHOLD_VARIATION);
};

/*
 * An estimation for the fee by using the staking gas and scaling accordingly.
 * Buffer added so that the transaction never fails - we'll always overestimate.
 */
export const getStakingFees = (t: Transaction, gasPrice: BigNumber): BigNumber => {
  const stakingGas = getStakingGas(t);

  return stakingGas
    .plus(STAKING_GAS_BASE) // Buffer
    .multipliedBy(gasPrice)
    .dividedBy(10);
};
