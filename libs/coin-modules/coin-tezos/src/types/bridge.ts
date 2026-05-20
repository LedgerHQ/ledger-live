import type { Stake } from "@ledgerhq/coin-module-framework/api/index";
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
import { TezosOperationMode } from "./model";

export type TezosResources = {
  revealed: boolean;
  counter: number;
};

export type TezosResourcesRaw = {
  revealed: boolean;
  counter: number;
};

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
  /** FA2 token contract (KT1…); set when `mode` is `send_token` */
  contractAddress?: string;
  /** FA2 token id; set when `mode` is `send_token` */
  tokenId?: number;
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
  contractAddress?: string;
  tokenId?: number;
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

/**
 * Tezos staking position as exposed on the synced account (front-side shape).
 * Mirrors the framework `Stake` populated by `buildStakesForAccount` but uses
 * `BigNumber` to match the Account-side convention shared with `balance`,
 * `spendableBalance`, and the `stakingResources` aggregate used by other coins.
 */
export type StakingPosition = Omit<Stake, "amount" | "amountDeposited" | "amountRewarded"> & {
  amount: BigNumber;
  amountDeposited?: BigNumber;
  amountRewarded?: BigNumber;
};

export type TezosAccount = Account & {
  tezosResources: TezosResources;
  stakingPositions: StakingPosition[];
};
export function isTezosAccount(account: Account): account is TezosAccount {
  return "tezosResources" in account;
}

/**
 * Persistable shape of a Tezos {@link StakingPosition}. uid prefix encodes the
 * staking kind: delegation-* / stake-* / unstaking-* / finalizable-*; `BigNumber`
 * amounts are serialized as decimal strings, and `asset` is omitted because Tezos
 * stakes are always native and the field is reconstructed on read.
 */
export type StakingPositionRaw = {
  uid: string;
  address: string;
  delegate?: string;
  state: "inactive" | "activating" | "active" | "deactivating";
  amount: string;
  /** ISO timestamp; present on unstake positions only. */
  createdAt?: string;
};

export type TezosAccountRaw = AccountRaw & {
  tezosResources: TezosResourcesRaw;
  stakingPositions?: StakingPositionRaw[];
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type TezosOperation = Operation<TezosOperationExtra>;

export type TezosOperationExtra = {
  id?: number; // Used as most recent operation id for incremental sync
};
