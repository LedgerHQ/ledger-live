// @flow

import { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw
} from "../../types/transaction";

export type CoreStatics = {};

export type CoreAccountSpecifics = {};

export type CoreOperationSpecifics = {};

export type CoreCurrencySpecifics = {};

export type TronOperationMode =
  | "send"
  | "freeze"
  | "unfreeze"
  | "vote"
  | "claimReward";
export type TronResource = "BANDWIDTH" | "ENERGY";

export type NetworkInfo = {|
  family: "tron",
  freeNetUsed: number,
  freeNetLimit: number,
  NetUsed: number,
  NetLimit: number,
  EnergyLimit: ?number
|};

export type NetworkInfoRaw = {|
  family: "tron",
  freeNetUsed: number,
  freeNetLimit: number,
  NetUsed: number,
  NetLimit: number,
  EnergyLimit: ?number
|};

export type Transaction = {|
  ...TransactionCommon,
  family: "tron",
  mode: TronOperationMode,
  resource: ?TronResource,
  networkInfo: ?NetworkInfo,
  duration: ?number,
  votes: Vote[]
|};

export type TransactionRaw = {|
  ...TransactionCommonRaw,
  mode: TronOperationMode,
  family: "tron",
  resource: ?TronResource,
  networkInfo: ?NetworkInfoRaw,
  duration: ?number,
  votes: Vote[]
|};

export type TrongridTxType =
  | "TransferContract"
  | "TransferAssetContract"
  | "FreezeBalanceContract"
  | "UnfreezeBalanceContract"
  | "VoteWitnessContract"
  | "TriggerSmartContract"
  | "WithdrawBalanceContract"
  | "ExchangeTransactionContract";

export type TrongridTxInfo = {|
  txID: string,
  date: Date,
  type: TrongridTxType,
  tokenId?: string,
  from: string,
  to?: string,
  value?: BigNumber,
  fee?: BigNumber,
  resource?: TronResource
|};

export type SendTransactionData = {|
  to_address: string,
  owner_address: string,
  amount: number,
  asset_name: ?string
|};

export type SmartContractFunction = "transfer(address,uint256)";

export type SmartContractTransactionData = {|
  function_selector: SmartContractFunction,
  fee_limit: number,
  call_value: number,
  contract_address: string,
  parameter: string,
  owner_address: string
|};

export type UnfreezeTransactionData = {|
  receiver_address?: string,
  owner_address: string,
  resource: ?TronResource
|};

export type FreezeTransactionData = {|
  receiver_address?: string,
  owner_address: string,
  frozen_balance: number,
  frozen_duration: number,
  resource: ?TronResource
|};

export type SendTransactionDataSuccess = {|
  raw_data_hex?: string,
  raw_data: Object,
  txID: string,
  signature: ?(string[])
|};

export const reflect = (_declare: *) => {};

export type SuperRepresentativeData = {|
  list: SuperRepresentative[],
  totalVotes: number,
  nextVotingDate: Date
|};

export type SuperRepresentative = {|
  address: string,
  name: ?string,
  url: ?string,
  isJobs: boolean,
  brokerage: number,
  voteCount: number,
  totalProduced: ?number,
  totalMissed: ?number,
  latestBlockNum: ?number,
  latestSlotNum: ?number
|};

export type TronResources = {|
  frozen: {
    bandwidth: ?FrozenInfo,
    energy: ?FrozenInfo
  },
  delegatedFrozen: {
    bandwidth: ?FrozenInfo,
    energy: ?FrozenInfo
  },
  votes: Vote[],
  tronPower: number,
  energy: number,
  bandwidth: BandwidthInfo,
  unwithdrawnReward: number
|};

export type TronResourcesRaw = {|
  frozen: {
    bandwidth: ?FrozenInfoRaw,
    energy: ?FrozenInfoRaw
  },
  delegatedFrozen: {
    bandwidth: ?FrozenInfoRaw,
    energy: ?FrozenInfoRaw
  },
  votes: Vote[],
  tronPower: number,
  energy: number,
  bandwidth: BandwidthInfo,
  unwithdrawnReward: number
|};

export type Vote = {|
  address: string,
  voteCount: number
|};

export type FrozenInfo = {|
  amount: BigNumber,
  expiredAt: Date
|};

export type FrozenInfoRaw = {|
  amount: string,
  expiredAt: string
|};

export type BandwidthInfo = {|
  freeUsed: number,
  freeLimit: number,
  gainedUsed: number,
  gainedLimit: number
|};
