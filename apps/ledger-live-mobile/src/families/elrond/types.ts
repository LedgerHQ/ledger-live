import type { ElrondProvider } from "@ledgerhq/live-common/families/elrond/types";

export interface UnbondingType {
  amount: string;
  seconds: number;
  validator?: ElrondProvider;
}

export interface DelegationType {
  address: string;
  claimableRewards: string;
  contract: string;
  userActiveStake: string;
  userUnBondable: string;
  userUndelegatedList: UnbondingType[];
  validator?: ElrondProvider;
}

export interface NavigationType {
  [key: string]: object;
}
