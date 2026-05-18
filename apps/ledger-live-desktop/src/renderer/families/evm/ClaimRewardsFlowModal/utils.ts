import { StakingDelegation } from "@ledgerhq/live-common/families/evm/staking/types";

export function findDelegationByValidator(
  address: string,
  delegations: StakingDelegation[],
): StakingDelegation | undefined {
  return delegations.find(delegation => delegation.validatorAddress === address);
}
