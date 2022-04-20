import { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";

export type TronOperationMode =
  | "send"
  | "freeze"
  | "unfreeze"
  | "vote"
  | "claimReward";
export type TronResource = "BANDWIDTH" | "ENERGY";
export type NetworkInfo = {
  family: "tron";
  freeNetUsed: BigNumber;
  freeNetLimit: BigNumber;
  netUsed: BigNumber;
  netLimit: BigNumber;
  energyUsed: BigNumber;
  energyLimit: BigNumber;
};
export type NetworkInfoRaw = {
  family: "tron";
  freeNetUsed: string;
  freeNetLimit: string;
  netUsed: string;
  netLimit: string;
  energyUsed: string;
  energyLimit: string;
};
export type Transaction = TransactionCommon & {
  family: "tron";
  mode: TronOperationMode;
  resource: TronResource | null | undefined;
  networkInfo: NetworkInfo | null | undefined;
  duration: number | null | undefined;
  votes: Vote[];
};
export type TransactionRaw = TransactionCommonRaw & {
  mode: TronOperationMode;
  family: "tron";
  resource: TronResource | null | undefined;
  networkInfo: NetworkInfoRaw | null | undefined;
  duration: number | null | undefined;
  votes: Vote[];
};
export type TrongridTxType =
  | "TransferContract"
  | "TransferAssetContract"
  | "FreezeBalanceContract"
  | "UnfreezeBalanceContract"
  | "VoteWitnessContract"
  | "TriggerSmartContract"
  | "WithdrawBalanceContract"
  | "ExchangeTransactionContract";
export type TrongridTxInfo = {
  txID: string;
  date: Date;
  type: TrongridTxType;
  tokenId?: string;
  from: string;
  to?: string;
  value?: BigNumber;
  fee?: BigNumber;
  resource?: TronResource;
  blockHeight?: number;
  extra?: TrongridExtraTxInfo;
  hasFailed: boolean;
};
export type TrongridExtraTxInfo =
  | TrongridFreezeTxInfo
  | TrongridUnfreezeTxInfo
  | TrongridVotesTxInfo;
export type TrongridFreezeTxInfo = {
  frozenAmount: BigNumber;
};
export type TrongridUnfreezeTxInfo = {
  unfreezeAmount: BigNumber;
};
export type TrongridVotesTxInfo = {
  votes: Vote[];
};

/** Payload types to send to trongrid */
export type SendTransactionData = {
  to_address: string;
  owner_address: string;
  amount: number;
  asset_name: string | null | undefined;
};
export type SmartContractFunction = "transfer(address,uint256)";
export type SmartContractTransactionData = {
  function_selector: SmartContractFunction;
  fee_limit: number;
  call_value: number;
  contract_address: string;
  parameter: string;
  owner_address: string;
};
export type UnfreezeTransactionData = {
  receiver_address?: string;
  owner_address: string;
  resource: TronResource | null | undefined;
};
export type FreezeTransactionData = {
  receiver_address?: string;
  owner_address: string;
  frozen_balance: number;
  frozen_duration: number;
  resource: TronResource | null | undefined;
};
export type SendTransactionDataSuccess = {
  raw_data_hex?: string;
  raw_data: Record<string, any> | undefined;
  txID: string;
  signature: string[] | null | undefined;
};

export type SuperRepresentativeData = {
  list: SuperRepresentative[];
  totalVotes: number;
  nextVotingDate: Date;
};
export type SuperRepresentative = {
  address: string;
  name: string | null | undefined;
  url: string | null | undefined;
  isJobs: boolean;
  brokerage: number;
  voteCount: number;
  totalProduced: number | null | undefined;
  totalMissed: number | null | undefined;
  latestBlockNum: number | null | undefined;
  latestSlotNum: number | null | undefined;
};
export type TronResources = {
  frozen: {
    bandwidth: FrozenInfo | null | undefined;
    energy: FrozenInfo | null | undefined;
  };
  delegatedFrozen: {
    bandwidth: DelegatedFrozenInfo | null | undefined;
    energy: DelegatedFrozenInfo | null | undefined;
  };
  votes: Vote[];
  tronPower: number;
  energy: BigNumber;
  bandwidth: BandwidthInfo;
  unwithdrawnReward: BigNumber;
  lastWithdrawnRewardDate: Date | null | undefined;
  lastVotedDate: Date | null | undefined;
  cacheTransactionInfoById: Record<string, TronTransactionInfo>;
};
export type TronResourcesRaw = {
  frozen: {
    bandwidth: FrozenInfoRaw | null | undefined;
    energy: FrozenInfoRaw | null | undefined;
  };
  delegatedFrozen: {
    bandwidth: DelegatedFrozenInfoRaw | null | undefined;
    energy: DelegatedFrozenInfoRaw | null | undefined;
  };
  votes: Vote[];
  tronPower: number;
  energy: string;
  bandwidth: BandwidthInfoRaw;
  unwithdrawnReward: string;
  lastWithdrawnRewardDate: string | null | undefined;
  lastVotedDate: string | null | undefined;
  cacheTransactionInfoById?: Record<string, TronTransactionInfoRaw>;
};
export type Vote = {
  address: string;
  voteCount: number;
};
export type FrozenInfo = {
  amount: BigNumber;
  expiredAt: Date;
};
export type FrozenInfoRaw = {
  amount: string;
  expiredAt: string;
};
export type DelegatedFrozenInfo = {
  amount: BigNumber;
};
export type DelegatedFrozenInfoRaw = {
  amount: string;
};
export type BandwidthInfo = {
  freeUsed: BigNumber;
  freeLimit: BigNumber;
  gainedUsed: BigNumber;
  gainedLimit: BigNumber;
};
export type BandwidthInfoRaw = {
  freeUsed: string;
  freeLimit: string;
  gainedUsed: string;
  gainedLimit: string;
};
export type TronTransactionInfo = {
  fee: number;
  blockNumber: number;
  withdraw_amount: number;
  unfreeze_amount: number;
};
export type TronTransactionInfoRaw = [number, number, number, number];
