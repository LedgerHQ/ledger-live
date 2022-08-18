// @flow

export type ValidatorType = {
  address: string;
  apr: string;
  aprValue: number;
  automaticActivation: boolean;
  changeableServiceFee: boolean;
  checkCapOnRedelegate: boolean;
  contract: string;
  createdNonce: number;
  explorerURL: string;
  featured: boolean;
  identity: {
    key: string;
    name: string;
    avatar: string;
    description: string;
    location?: string;
    twitter: string;
    url: string;
  };
  initialOwnerFunds: string;
  maxDelegateAmountAllowed: string;
  maxDelegationCap: string;
  numNodes: number;
  numUsers: number;
  owner: string;
  ownerBelowRequiredBalanceThreshold: boolean;
  serviceFee: string;
  totalActiveStake: string;
  totalUnStaked: string;
  unBondPeriod: number;
  withDelegationCap: boolean;
  disabled?: boolean;
};

export type UnbondingType = {
  amount: string;
  seconds: number;
  contract?: string;
  validator?: ValidatorType;
};

export type DelegationType = {
  address: string;
  claimableRewards: string;
  contract: string;
  userActiveStake: string;
  userUnBondable: string;
  userUndelegatedList: Array<UnbondingType>;
  validator: ValidatorType;
};
