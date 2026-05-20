import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

export type StakingDelegationStatus =
  | "bonded" // in the active set, generates rewards
  | "unbonding" // validator removed from active set, voting power frozen for a network-specific unbonding period
  | "unbonded";

export type StakingDelegation = {
  validatorAddress: string;
  amount: BigNumber;
  pendingRewards: BigNumber;
  status: StakingDelegationStatus;
};

export type StakingDelegationRaw = {
  validatorAddress: string;
  amount: string;
  pendingRewards: string;
  status: StakingDelegationStatus;
};

export type StakingRedelegation = {
  validatorSrcAddress: string;
  validatorDstAddress: string;
  amount: BigNumber;
  completionDate: Date;
};

export type StakingRedelegationRaw = {
  validatorSrcAddress: string;
  validatorDstAddress: string;
  amount: string;
  completionDate: string;
};

export type StakingUnbonding = {
  validatorAddress: string;
  amount: BigNumber;
  completionDate: Date;
};

export type StakingUnbondingRaw = {
  validatorAddress: string;
  amount: string;
  completionDate: string;
};

export type StakingResources = {
  delegations: StakingDelegation[];
  redelegations: StakingRedelegation[];
  unbondings: StakingUnbonding[];
  delegatedBalance: BigNumber;
  pendingRewardsBalance: BigNumber;
  unbondingBalance: BigNumber;
  validators?: StakingValidatorItem[];
};

export type StakingResourcesRaw = {
  delegations: StakingDelegationRaw[];
  redelegations: StakingRedelegationRaw[];
  unbondings: StakingUnbondingRaw[];
  delegatedBalance: string;
  pendingRewardsBalance: string;
  unbondingBalance: string;
  validators?: StakingValidatorItem[];
};

export type StakingDelegationInfo = {
  address: string;
  amount: BigNumber;
};

export type StakingDelegationInfoRaw = {
  address: string;
  amount: string;
};

export type StakingOperation =
  | "delegate"
  | "undelegate"
  | "redelegate"
  | "getStakedBalance"
  | "getUnstakedBalance"
  | "claimReward";

/**
 * Per-chain strategy for fetching active redelegations from an off-chain source.
 *
 * Add a new member to this union when implementing redelegation for a chain
 * that uses a different API or address format.
 *
 * - `cosmos-rest`: query the Cosmos REST API using the canonical Cosmos address
 *   resolved via the chain's address precompile (`getSeiAddr` on Sei).  The
 *   EVM RPC URL is read from the currency's node config (`getCoinConfig`).
 * - `none`: no off-chain source; rely solely on on-chain tx history
 *   (`buildRedelegationsFromOps`).
 */
export type RedelegationStrategy =
  | {
      type: "cosmos-rest";
      /** Cosmos bech32 human-readable part (e.g. "sei"). */
      hrp: string;
      /** REST endpoint template; `{address}` is replaced with the resolved Cosmos address. */
      endpoint: string;
    }
  | { type: "none" };

export type StakingContractConfig = {
  contractAddress: string;
  specificContractAddressByOperation?: Partial<Record<StakingOperation, string>>;
  functions: Partial<Record<StakingOperation, string>> & {
    // necessary function names below
    delegate: string;
    undelegate: string;
    getStakedBalance: string;
  };
  apiConfig?: {
    baseUrl: string;
    validatorsEndpoint: string;
    /**
     * Address precompile used to resolve the canonical Cosmos bech32 address
     * for a given EVM address.  Required for `cosmos-rest` redelegation
     * strategy.  The EVM RPC URL is read from the currency's node config
     * (`getCoinConfig`) rather than duplicated here.
     *
     * Different Cosmos EVM chains may expose this precompile at different
     * addresses with different function signatures, so both fields must be
     * configured per chain.
     *
     * Example (Sei): address `0x…1004`, abi `"function getSeiAddr(address) view returns (string)"`.
     */
    precompileAddress?: {
      /** Precompile contract address (checksummed or lowercase hex). */
      address: string;
      /** Single human-readable ABI fragment for the address-lookup function. */
      abi: string;
    };
  };
  /** How to fetch active redelegations from an off-chain source. Defaults to `"none"` when absent. */
  redelegationStrategy?: RedelegationStrategy;
  explorerConfig?: {
    validatorUrl: string;
  };
  unbondingPeriodDays?: number;
  /**
   * Maximum number of concurrent active redelegation entries allowed per
   * account, as enforced by the chain's staking module.  When omitted, no cap
   * is applied.
   */
  maxRedelegations?: number;
  /**
   * Multiplier to convert amounts from the calldata unit back to the EVM-native
   * 18-decimal unit (wei).  Needed for chains whose staking precompile encodes
   * amounts in a smaller unit (e.g. SEI uses usei = 10^6, so the scale is 10^12).
   * Defaults to 1n (no conversion) when omitted.
   */
  calldataAmountScale?: bigint;
};

export type StakeCreate = {
  currency: CryptoCurrency;
  address: string;
  currencyId: string;
  validatorAddress: string;
  config: StakingContractConfig;
};

type SeiDelegationBalance = {
  amount: string | number | bigint;
  denom: string;
};

type SeiDelegationDetails = {
  delegator_address: string;
  shares: string | number;
  decimals: string | number;
  validator_address: string;
};

export type SeiDelegation = {
  balance: SeiDelegationBalance;
  delegation: SeiDelegationDetails;
};

export type StakingFetcher = (
  address: string,
  config: StakingContractConfig,
  currency: CryptoCurrency,
) => Promise<Stake[]>;

/**
 * Configuration for a staking strategy
 */
export type StakingStrategy = {
  fetcher: StakingFetcher;
};

/**
 * Function signature for amount extractors
 */
export type StakingExtractor = (decoded: unknown) => bigint;

export interface EncodeStakingDataParams {
  currencyId: string;
  operation: StakingOperation;
  config: StakingContractConfig;
  params: unknown[];
}

// NB this must be serializable (no Date, no BigNumber)
export type StakingValidatorItem = {
  validatorAddress: string;
  name: string;
  votingPower: number;
  // value from 0.0 to 1.0 (normalized percentage)
  commission: number;
  // value from 0.0 to 1.0 (normalized percentage)
  estimatedYearlyRewardsRate: number; // value from 0.0 to 1.0 (normalized percentage)
  tokens: number;
};
export type StakingLikeNetworkInfo = {
  family: string;
  fees: BigNumber;
};

export type StakingLikeNetworkInfoRaw = {
  family: string;
  fees: string;
};

export type StakingOperationExtra = OperationExtra & {
  validators?: StakingDelegationInfo[];
  validator?: StakingDelegationInfo;
  sourceValidator?: string;
};

export function isStakingOperationExtra(op: OperationExtra): op is StakingOperationExtra {
  return (
    op !== null &&
    typeof op === "object" &&
    ("validators" in op || "validator" in op || "sourceValidator" in op)
  );
}

export type StakingOperationExtraRaw = OperationExtraRaw & {
  validators?: StakingDelegationInfoRaw[];
  validator?: StakingDelegationInfoRaw;
  sourceValidator?: string;
};

export function isStakingOperationExtraRaw(op: OperationExtraRaw): op is StakingOperationExtraRaw {
  return (
    op !== null &&
    typeof op === "object" &&
    ("validators" in op || "validator" in op || "sourceValidator" in op)
  );
}

export type StakingMappedDelegation = StakingDelegation & {
  formattedAmount: string;
  formattedPendingRewards: string;
  rank: number;
  validator: StakingValidatorItem | null | undefined;
};

export type StakingMappedUnbonding = StakingUnbonding & {
  formattedAmount: string;
  validator: StakingValidatorItem | null | undefined;
};

export type StakingMappedRedelegation = StakingRedelegation & {
  formattedAmount: string;
  validatorSrc: StakingValidatorItem | null | undefined;
  validatorDst: StakingValidatorItem | null | undefined;
};

export type StakingMappedDelegationInfo = StakingDelegationInfo & {
  validator: StakingValidatorItem | null | undefined;
  formattedAmount: string;
};

export type StakingMappedValidator = {
  rank: number;
  validator: StakingValidatorItem;
};

export type StakingSearchFilter = (
  query: string,
) => (item: StakingMappedDelegation | StakingMappedValidator) => boolean;

export function isStakingAccount(account: Account): account is StakingAccount {
  return "stakingResources" in account;
}
export type StakingAccount = Account & { stakingResources: StakingResources };

export type StakingAccountRaw = AccountRaw & {
  stakingResources: StakingResourcesRaw;
};
