import { ProtocolParams } from "../types";

type APIToken = { assetName: string; policyId: string; value: string };

type APIMetadata = { label: string; value: string };

export enum HashType {
  ADDRESS = 0,
  SCRIPT = 1,
}

export type StakeCredential = {
  key: string;
  type: HashType;
};

export type StakeKeyRegistrationCertificate = {
  index: number;
  stakeCredential: StakeCredential;
};

export type StakeKeyDeRegistrationCertificate = {
  index: number;
  stakeCredential: StakeCredential;
};

export type StakeDelegationCertificate = {
  index: number;
  poolKeyHash: string;
  stakeCredential: StakeCredential;
};

export type StakeRegConway = {
  index: number;
  stakeHex: string;
  deposit: string;
};

export type StakeDeRegConway = {
  index: number;
  stakeHex: string;
  deposit: string;
};

export type TransactionCertificate =
  | StakeKeyRegistrationCertificate
  | StakeKeyDeRegistrationCertificate
  | StakeDelegationCertificate
  | StakeRegConway
  | StakeDeRegConway;

export type TransactionCertificates = {
  stakeRegistrations: Array<StakeKeyRegistrationCertificate>;
  stakeDeRegistrations: Array<StakeKeyDeRegistrationCertificate>;
  stakeDelegations: Array<StakeDelegationCertificate>;
  stakeRegsConway?: Array<StakeRegConway>;
  stakeDeRegsConway?: Array<StakeDeRegConway>;
};

export type APITransaction = {
  fees: string;
  hash: string;
  timestamp: string;
  blockHeight: number;
  inputs: Array<{
    txId: string;
    index: number;
    address: string;
    value: string;
    paymentKey: string;
    tokens: Array<APIToken>;
  }>;
  certificate: TransactionCertificates;
  outputs: Array<{
    address: string;
    value: string;
    paymentKey: string;
    tokens: Array<APIToken>;
  }>;
  metadata?: {
    hash: string;
    data: Array<APIMetadata>;
  };
  withdrawals?: Array<{
    stakeCredential: StakeCredential;
    stakeHex: string;
    amount: string;
  }>;
};

export type APINetworkInfo = {
  protocolParams: ProtocolParams;
};

export type APIDelegation = {
  deposit: string;
  stakeHex: string;
  status: boolean;
  stake: string;
  rewardsAvailable: string;
  rewardsWithdrawn: string;
  poolInfo:
    | {
        poolId: string;
        name: string | undefined;
        ticker: string | undefined;
      }
    | undefined;
  dRepInfo:
    | {
        hex: string;
      }
    | undefined;
};

export type StakePool = {
  poolId: string;
  name: string | undefined;
  ticker: string | undefined;
  website: string | undefined;
  margin: string;
  cost: string;
  pledge: string;
  retiredEpoch: number | undefined;
  liveStake: string;
};

export type APIGetPoolList = {
  pageNo: number;
  limit: number;
  count: number;
  pools: Array<StakePool>;
};

export type APIGetPoolsDetail = {
  pools: Array<StakePool>;
};
