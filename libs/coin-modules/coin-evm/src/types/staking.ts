import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

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
