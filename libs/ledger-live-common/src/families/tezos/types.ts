import type {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

export type TezosResources = {
  revealed: boolean;
  counter: number;
};

export type TezosResourcesRaw = {
  revealed: boolean;
  counter: number;
};

export type TezosOperationMode = "send" | "delegate" | "undelegate";

export type NetworkInfo = {
  family: "tezos";
  fees: BigNumber;
};

export type NetworkInfoRaw = {
  family: "tezos";
  fees: string;
};

// TODO add a field for indicating if staking
export type Transaction = TransactionCommon & {
  family: "tezos";
  mode: TezosOperationMode;
  networkInfo: NetworkInfo | null | undefined;
  fees: BigNumber | null | undefined;
  gasLimit: BigNumber | null | undefined;
  storageLimit: BigNumber | null | undefined;
  estimatedFees: BigNumber | null | undefined;
  taquitoError: string | null | undefined;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "tezos";
  mode: TezosOperationMode;
  networkInfo: NetworkInfoRaw | null | undefined;
  fees: string | null | undefined;
  gasLimit: string | null | undefined;
  storageLimit: string | null | undefined;
  estimatedFees: string | null | undefined;
  taquitoError: string | null | undefined;
};

type CapacityStatus = "normal" | "full";

export type Baker = {
  address: string;
  name: string;
  logoURL: string;
  nominalYield: `${number} %`;
  capacityStatus: CapacityStatus;
};

// type used by UI to facilitate business logic of current delegation data
export type Delegation = {
  // delegator address
  address: string;
  // if not defined, we need to render "Unknown" on the UI. we don't know who is delegator.
  baker: Baker | null | undefined;
  // operation related to delegation (to know the date info)
  operation: Operation;
  // true if the delegation is pending (optimistic update)
  isPending: boolean;
  // true if a receive should inform it will top up the delegation
  receiveShouldWarnDelegation: boolean;
  // true if a send should inform it will top down the delegation
  sendShouldWarnDelegation: boolean;
};

export type API_BAKER = {
  address: string;
  name: string;
  logo: string;
  balance: number;
  stakingBalance: number;
  stakingCapacity: number;
  maxStakingBalance: number;
  freeSpace: number;
  fee: number;
  minDelegation: number;
  payoutDelay: number;
  payoutPeriod: number;
  openForDelegation: true;
  estimatedRoi: number;
  serviceType: string;
  serviceHealth: string;
  payoutTiming: string;
  payoutAccuracy: string;
  audit?: string;
  insuranceCoverage: number;
};

export type TezosAccount = Account & { tezosResources: TezosResources };

export type TezosAccountRaw = AccountRaw & {
  tezosResources: TezosResourcesRaw;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type TezosOperation = Operation<TezosOperationExtra>;

export type TezosOperationExtra = {
  id?: number; // Used as most recent operation id for incremental sync
};
