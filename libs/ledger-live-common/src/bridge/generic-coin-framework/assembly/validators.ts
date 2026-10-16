import type { Validator } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { StakingValidatorItem } from "@ledgerhq/types-live";

/** A validator as either path reads it: the coin module's (bigint pool) or its JSON form. */
export type ValidatorSource = Pick<Validator, "address" | "commissionRate" | "apy"> & {
  name?: string;
  balance?: bigint | string;
};

/**
 * Whether the account reads the validator list: only `stakingResources` carries it, which a family
 * reporting staking positions does not build.
 */
export function readsValidators(
  bridgeApi: Pick<BridgeApi, "stakingSupported" | "usesStakingPositions">,
): boolean {
  return bridgeApi.stakingSupported === true && bridgeApi.usesStakingPositions !== true;
}

export function toValidatorItems(items: ValidatorSource[]): StakingValidatorItem[] {
  return items.map(validator => ({
    validatorAddress: validator.address,
    name: validator.name ?? validator.address,
    commission: Number(validator.commissionRate ?? 0),
    tokens: String(validator.balance ?? 0),
    votingPower: 0,
    estimatedYearlyRewardsRate: Number(validator.apy ?? 0),
  }));
}
