import type { MultiversXProvider } from "@ledgerhq/live-common/families/multiversx/types";

export interface UnbondingType {
  amount: string;
  seconds: number;
  validator?: MultiversXProvider;
}

export interface DelegationType {
  address: string;
  claimableRewards: string;
  contract: string;
  userActiveStake: string;
  userUnBondable: string;
  userUndelegatedList: UnbondingType[];
  validator?: MultiversXProvider;
}

export interface NavigationType {
  [key: string]: object;
}
