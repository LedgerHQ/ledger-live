// Encapsulate for LLD et LLM
export * from "@ledgerhq/coin-tezos/types/index";

import type { Stake, StakeState } from "@ledgerhq/coin-module-framework/api/index";
import type { Baker, TezosOperationMode } from "@ledgerhq/coin-tezos/types/index";
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

// type used by UI to facilitate business logic of current delegation data
export type Delegation = {
  // address of the baker this account delegates to
  address: string;
  // if not defined, we need to render "Unknown" on the UI: this baker is not in our list.
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

export type StakingPosition = Omit<Stake, "amount" | "amountDeposited" | "amountRewarded"> & {
  amount: BigNumber;
  amountDeposited?: BigNumber;
  amountRewarded?: BigNumber;
};

export type TezosAccount = Account & {
  tezosResources?: TezosResources;
  stakingPositions?: StakingPosition[];
};
// Paris-upgrade accounts may lack tezosResources until first sync — classify by family.
export function isTezosAccount(account: Account): account is TezosAccount {
  return account.currency.family === "tezos";
}

export type StakingPositionRaw = {
  uid: string;
  address: string;
  delegate?: string;
  state: StakeState;
  amount: string;
  createdAt?: string;
};

export type TezosAccountRaw = AccountRaw & {
  tezosResources?: TezosResourcesRaw;
  stakingPositions?: StakingPositionRaw[];
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type TezosOperation = Operation<TezosOperationExtra>;

export type TezosOperationExtra = {
  id?: number; // Used as most recent operation id for incremental sync
};

export type TezosAddress = {
  address: string;
  publicKey: string;
};
export type TezosSignature = {
  signature: string;
};
// Type coming from hw-app-tezos
type TezosCurves = {
  ED25519: 0x00;
  SECP256K1: 0x01;
  SECP256R1: 0x02;
};
export type Curve = TezosCurves[keyof TezosCurves];

export interface TezosSigner {
  getAddress(
    path: string,
    options: {
      verify?: boolean;
      curve?: Curve;
      ins?: number;
    },
  ): Promise<TezosAddress>;
  signOperation(
    path: string,
    rawTxHex: string,
    options: {
      curve?: Curve;
    },
  ): Promise<TezosSignature>;
}
