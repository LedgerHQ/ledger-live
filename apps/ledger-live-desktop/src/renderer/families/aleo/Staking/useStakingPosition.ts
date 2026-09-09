import BigNumber from "bignumber.js";
import { useMemo } from "react";
import type { AleoAccount, AleoValidator } from "@ledgerhq/live-common/families/aleo/types";
import { useAleoValidators } from "@ledgerhq/live-common/families/aleo/react";
import {
  getClaimableStakingBalance,
  hasPendingOperationType,
} from "@ledgerhq/live-common/families/aleo/utils";

export type AleoNonEarningReason = NonNullable<AleoValidator["nonEarningReason"]> | "leftCommittee";

export type AleoStakingPosition = {
  bondedBalance: BigNumber;
  bondedValidator: string | null;
  validatorLabel: string;
  nonEarningReason: AleoNonEarningReason | undefined;
  /**
   * Estimated net yearly rate as a fraction (0.07 = 7%). Undefined when it could not be
   * derived; `0` is a real value meaning "earns nothing" — never conflate the two.
   */
  estimatedRate: number | undefined;
  unbondingBalance: BigNumber;
  unbondingHeight: number | null;
  claimableBalance: BigNumber;
  hasBonded: boolean;
  hasUnbonding: boolean;
  hasPendingUnbond: boolean;
  hasPendingClaim: boolean;
  hasPendingUnbondingChange: boolean;
};

export function useStakingPosition(account: AleoAccount): AleoStakingPosition {
  const { validators, loading } = useAleoValidators(account.currency);

  const bondedBalance = account.aleoResources?.bondedBalance ?? new BigNumber(0);
  const unbondingBalance = account.aleoResources?.unbondingBalance ?? new BigNumber(0);
  const unbondingHeight = account.aleoResources?.unbondingHeight ?? null;
  const claimableBalance = getClaimableStakingBalance(account);
  const bondedValidator = account.aleoResources?.bondedValidator ?? null;

  const validator = useMemo(
    () => (bondedValidator ? validators.find(item => item.address === bondedValidator) : undefined),
    [validators, bondedValidator],
  );

  const hasBonded = bondedBalance.gt(0);
  const hasPendingUnbond = hasPendingOperationType(account, "UNBOND");
  const hasPendingClaim = hasPendingOperationType(account, "WITHDRAW_UNBONDED");

  const nonEarningReason: AleoNonEarningReason | undefined =
    loading || !hasBonded ? undefined : validator ? validator.nonEarningReason : "leftCommittee";

  const estimatedRate = nonEarningReason ? 0 : validator?.estimatedYearlyRewardsRate;

  return {
    bondedBalance,
    bondedValidator,
    validatorLabel: validator?.name || bondedValidator || "",
    nonEarningReason,
    estimatedRate,
    unbondingBalance,
    unbondingHeight,
    claimableBalance,
    hasBonded,
    hasUnbonding: unbondingBalance.gt(0),
    hasPendingUnbond,
    hasPendingClaim,
    hasPendingUnbondingChange: hasPendingUnbond || hasPendingClaim,
  };
}
