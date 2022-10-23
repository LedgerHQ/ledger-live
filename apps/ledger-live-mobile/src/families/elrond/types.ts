// @flow

export interface ValidatorType {
  address: string;
  aprValue: number;
  automaticActivation: boolean;
  changeableServiceFee: boolean;
  checkCapOnRedelegate: boolean;
  createdNonce: number;
  featured: boolean;
  numNodes: number;
  numUsers: number;
  ownerBelowRequiredBalanceThreshold: boolean;
  unBondPeriod: number;
  withDelegationCap: boolean;
  disabled?: boolean;
  identity: {
    key: string;
    name: string;
    avatar: string;
    description: string;
    location?: string;
    twitter: string;
    url: string;
  };
}

export interface UnbondingType {
  amount: string;
  seconds: number;
  validator?: ValidatorType;
}

export interface DelegationType {
  [key: string]: any;
  address: string;
  claimableRewards: string;
  contract: string;
  userActiveStake: string;
  userUnBondable: string;
  userUndelegatedList: UnbondingType[];
  validator?: ValidatorType;
}
