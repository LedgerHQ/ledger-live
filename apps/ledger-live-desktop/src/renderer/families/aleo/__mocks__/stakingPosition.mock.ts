import BigNumber from "bignumber.js";
import type { AleoStakingPositionView } from "@ledgerhq/live-common/families/aleo/react";
import { ALEO_VALIDATOR_ADDRESS } from "./validator.mock";

export const UNBONDING_HEIGHT = 1_000;

/** 20 ALEO bonded to the Figment address the account mocks use, earning 6.2%. */
const BONDED = {
  bondedBalance: new BigNumber(20_000_000),
  bondedValidator: ALEO_VALIDATOR_ADDRESS,
  validatorLabel: "Figment",
  estimatedRate: 0.062,
  hasBonded: true,
} satisfies Partial<AleoStakingPositionView>;

/**
 * A 5 ALEO unbonding entry, 2 of which has already come free. The three figures differ on purpose:
 * a view reading `unbondingBalance` where it means `unstakingBalance` then fails.
 */
const UNBONDING = {
  unbondingBalance: new BigNumber(5_000_000),
  unstakingBalance: new BigNumber(3_000_000),
  claimableBalance: new BigNumber(2_000_000),
  unbondingHeight: UNBONDING_HEIGHT,
  hasUnbonding: true,
} satisfies Partial<AleoStakingPositionView>;

/**
 * A complete `AleoStakingPositionView`, so the compiler checks every field the staking views read
 * against what the hook actually returns. Never cast a partial in its place: a field renamed in
 * live-common would then reach the views as `undefined` instead of failing to build.
 */
export const aleoStakingPosition = (
  overrides: Partial<AleoStakingPositionView> = {},
): AleoStakingPositionView => ({
  bondedBalance: new BigNumber(0),
  bondedValidator: null,
  validatorLabel: null,
  nonEarningReason: undefined,
  estimatedRate: undefined,
  validatorsLoading: false,
  validatorsError: null,
  unbondingBalance: new BigNumber(0),
  unbondingHeight: null,
  claimableBalance: new BigNumber(0),
  unstakingBalance: new BigNumber(0),
  hasBonded: false,
  hasUnbonding: false,
  hasPendingUnbond: false,
  hasPendingClaim: false,
  hasPendingUnbondingChange: false,
  pendingKind: null,
  ...overrides,
});

export const bondedPosition = (overrides: Partial<AleoStakingPositionView> = {}) =>
  aleoStakingPosition({ ...BONDED, ...overrides });

export const unbondingPosition = (overrides: Partial<AleoStakingPositionView> = {}) =>
  aleoStakingPosition({ ...UNBONDING, ...overrides });

/** Staked with a validator while an earlier unbonding entry is still on its way out. */
export const bondedUnbondingPosition = (overrides: Partial<AleoStakingPositionView> = {}) =>
  aleoStakingPosition({ ...BONDED, ...UNBONDING, ...overrides });
