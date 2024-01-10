import {
  Account,
  AccountRaw,
  Operation,
  OperationRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

export type TronOperationMode =
  | "send"
  | "freeze"
  | "unfreeze"
  | "vote"
  | "claimReward"
  | "withdrawExpireUnfreeze"
  | "unDelegateResource"
  | "legacyUnfreeze";

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
  | "ExchangeTransactionContract"
  | "FreezeBalanceV2Contract"
  | "UnfreezeBalanceV2Contract"
  | "WithdrawExpireUnfreezeContract"
  | "UnDelegateResourceContract";

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

export type TronOperation = Operation<TrongridExtraTxInfo>;
export type TronOperationRaw = OperationRaw<TrongridExtraTxInfoRaw>;

export type TrongridExtraTxInfo = {
  frozenAmount?: BigNumber;
  unfreezeAmount?: BigNumber;
  votes?: Vote[];
  unDelegatedAmount?: BigNumber;
  receiverAddress?: string;
};
export type TrongridExtraTxInfoRaw = {
  frozenAmount?: string;
  unfreezeAmount?: string;
  votes?: Vote[];
  unDelegatedAmount?: string;
  receiverAddress?: string;
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

export type FreezeTransactionData = {
  owner_address: string;
  frozen_balance: number;
  resource: TronResource | null | undefined;
};

export type UnFreezeTransactionData = {
  owner_address: string;
  resource: TronResource | null | undefined;
  unfreeze_balance: number;
};

export type LegacyUnfreezeTransactionData = {
  receiver_address?: string;
  owner_address: string;
  resource: TronResource | null | undefined;
};

export type WithdrawExpireUnfreezeTransactionData = {
  owner_address: string;
};

export type UnDelegateResourceTransactionData = {
  owner_address: string;
  resource: TronResource | null | undefined;
  receiver_address: string;
  balance: number;
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
  unFrozen: {
    bandwidth: UnFrozenInfo[] | null | undefined;
    energy: UnFrozenInfo[] | null | undefined;
  };
  delegatedFrozen: {
    bandwidth: DelegatedFrozenInfo | null | undefined;
    energy: DelegatedFrozenInfo | null | undefined;
  };
  legacyFrozen: {
    bandwidth: LegacyFrozenInfo | null | undefined;
    energy: LegacyFrozenInfo | null | undefined;
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
  unFrozen: {
    bandwidth: UnFrozenInfoRaw[] | null | undefined;
    energy: UnFrozenInfoRaw[] | null | undefined;
  };
  delegatedFrozen: {
    bandwidth: DelegatedFrozenInfoRaw | null | undefined;
    energy: DelegatedFrozenInfoRaw | null | undefined;
  };
  legacyFrozen: {
    bandwidth: LegacyFrozenInfoRaw | null | undefined;
    energy: LegacyFrozenInfoRaw | null | undefined;
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

export type DelegatedFrozenInfo = {
  amount: BigNumber;
};
export type DelegatedFrozenInfoRaw = {
  amount: string;
};

export type FrozenInfo = {
  amount: BigNumber;
};

export type FrozenInfoRaw = {
  amount: string;
};

export type LegacyFrozenInfo = {
  amount: BigNumber;
  expiredAt: Date;
};

export type LegacyFrozenInfoRaw = {
  amount: string;
  expiredAt: string;
};

export type UnFrozenInfo = {
  amount: BigNumber;
  expireTime: Date;
};

export type UnFrozenInfoRaw = {
  amount: string;
  expireTime: string;
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
export type TronAccount = Account & { tronResources: TronResources };
export type TronAccountRaw = AccountRaw & { tronResources: TronResourcesRaw };
export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
