import type { MultiversxProvider } from "@ledgerhq/live-common/families/multiversx/types";

export interface UnbondingType {
  amount: string;
  seconds: number;
  validator?: MultiversxProvider;
}

export interface DelegationType {
  address: string;
  claimableRewards: string;
  contract: string;
  userActiveStake: string;
  userUnBondable: string;
  userUndelegatedList: UnbondingType[];
  validator?: MultiversxProvider;
}

export interface NavigationType {
  [key: string]: object;
}
