import { ElrondProvider } from "@ledgerhq/live-common/families/elrond/types";

export interface UnbondingType {
  amount: string;
  seconds: number;
  contract?: string;
  validator?: ElrondProvider;
}

export interface DelegationType {
  address: string;
  claimableRewards: string;
  contract: string;
  userActiveStake: string;
  userUnBondable: string;
  userUndelegatedList: Array<UnbondingType>;
  validator?: ElrondProvider;
}
