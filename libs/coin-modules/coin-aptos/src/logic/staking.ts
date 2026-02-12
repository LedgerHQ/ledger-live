import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { Unit } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { getMaxSendBalance } from "../bridge/logic";
import { MIN_COINS_ON_SHARES_POOL_IN_OCTAS } from "../constants";
import {
  AptosAccount,
  AptosMappedStakingPosition,
  AptosStakingPosition,
  AptosValidator,
} from "../types";

export const mapStakingPositions = (
  stakingPositions: AptosStakingPosition[],
  validators: AptosValidator[],
  unit: Unit,
): AptosMappedStakingPosition[] => {
  return stakingPositions.map(sp => {
    const rank = validators.findIndex(v => v.address === sp.validatorId);
    const validator = validators[rank] ?? sp;
    const formatConfig = {
      disableRounding: false,
      alwaysShowSign: false,
      showCode: true,
    };

    return {
      ...sp,
      formattedAmount: formatCurrencyUnit(unit, sp.active, formatConfig),
      formattedPending: formatCurrencyUnit(unit, sp.pendingInactive, formatConfig),
      formattedAvailable: formatCurrencyUnit(unit, sp.inactive, formatConfig),
      rank,
      validator,
    };
  });
};

export const canStake = (account: AptosAccount): boolean => {
  return getMaxSendBalance(account) > MIN_COINS_ON_SHARES_POOL_IN_OCTAS;
};

export const canUnstake = (
  stakingPosition: AptosMappedStakingPosition | AptosStakingPosition,
): boolean => {
  return stakingPosition.active.gt(0);
};

export const canWithdraw = (
  stakingPosition: AptosMappedStakingPosition | AptosStakingPosition,
): boolean => {
  return stakingPosition.inactive.gt(0);
};

export const canRestake = (
  stakingPosition: AptosMappedStakingPosition | AptosStakingPosition,
): boolean => {
  return stakingPosition.pendingInactive.gt(0);
};

export const getStakingPosition = (account: AptosAccount, validatorAddress: string) =>
  (account.aptosResources?.stakingPositions ?? []).find(
    stakingPosition => stakingPosition.validatorId === validatorAddress,
  );

export const getDelegationOpMaxAmount = (
  account: AptosAccount,
  validatorAddress: string,
  mode: string,
): BigNumber => {
  let maxAmount: BigNumber | undefined;

  const stakingPosition = getStakingPosition(account, validatorAddress);

  switch (mode) {
    case "unstake":
      maxAmount = stakingPosition?.active;
      break;
    case "withdraw":
      maxAmount = stakingPosition?.inactive;
      break;
    case "restake":
      maxAmount = stakingPosition?.pendingInactive;
  }

  if (maxAmount === undefined || maxAmount.lt(0)) {
    return new BigNumber(0);
  }

  return maxAmount;
};

export const formatUnlockTime = (epochSecs: string): string => {
  const unlockTime = parseInt(epochSecs, 10) * 1000; // Convert to ms
  const now = Date.now();
  const diffMs = unlockTime - now;

  if (diffMs <= 0) return "Unlocked";

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return `${days}d ${hours}h ${minutes}m`;
};
