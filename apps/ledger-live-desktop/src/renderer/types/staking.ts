import type { Operation } from "@ledgerhq/types-live";
import type { Stake } from "@ledgerhq/coin-framework/api/index";

type CapacityStatus = "normal" | "full";

export type Baker = {
  address: string;
  name: string;
  logoURL: string;
  nominalYield: `${number} %`;
  capacityStatus: CapacityStatus;
};

// type used by UI to facilitate business logic of current delegation data
export type Delegation = {
  // delegator address
  address: string;
  // if not defined, we need to render "Unknown" on the UI. we don't know who is delegator.
  baker: Baker | null | undefined;
  // operation related to delegation (to know the date info)
  operation: Operation;
  // true if the delegation is pending (optimistic update)
  isPending: boolean;
  // true if a receive should inform it will top up the delegation
  receiveShouldWarnDelegation: boolean;
  // true if a send should inform it will top down the delegation
  sendShouldWarnDelegation: boolean;
};

export type StakingPosition = Stake;
