import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export type StakingOperation =
  | "delegate"
  | "undelegate"
  | "redelegate"
  | "withdraw"
  | "getStakedBalance"
  | "getUnstakedBalance"
  | "claimReward"
  | "compoundReward";

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

/**
 * Per-chain strategy for fetching pending delegation rewards.
 *
 * - `cosmos-rest`: Cosmos distribution REST endpoint; EVM address resolved
 *   via `apiConfig.precompileAddress`. Reward coins matching `denom` summed
 *   (integer base-unit only) and multiplied by `scale` to wei.
 * - `none`: rewards unavailable off-chain.
 */
export type RewardsStrategy =
  | {
      type: "cosmos-rest";
      /** REST endpoint template; `{address}` is replaced with the resolved Cosmos address. */
      endpoint: string;
      /** Cosmos denom carrying the reward amount (e.g. "usei"). */
      denom: string;
      /** Multiplier converting one base-denom unit to wei. */
      scale: bigint;
    }
  | { type: "none" };

/**
 * Per-chain descriptor for recovering a REWARD operation's amount from the tx
 * receipt logs. Claim/compound txs are nonpayable (native value 0), so the
 * reward amount is not in `Operation.value`; it lives in an event the staking
 * precompile emits. This is the EVM analog of how Cosmos reads the amount from
 * tx events. Sum `data` word `amountWordIndex` of every log whose `address`
 * matches `contractAddress`, `topics[0]` matches `topic0`, and the indexed
 * delegator at `topics[delegatorTopicIndex]` matches the account, then scale.
 *
 * Compound emits both this reward event and a restake event with the same
 * amount; filtering strictly on `topic0` ignores the restake (no double-count).
 */
export type RewardsEventDecoder = {
  /** Address emitting the reward event (the staking/distribution precompile). */
  contractAddress: string;
  /** keccak256 of the reward event signature (the log's `topics[0]`). */
  topic0: string;
  /** Index in `topics` of the indexed delegator address. */
  delegatorTopicIndex: number;
  /** Index of the 32-byte word in `data` carrying the reward amount. */
  amountWordIndex: number;
  /** Multiplier converting the on-chain amount unit to wei (1n when already wei). */
  scale: bigint;
};

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
  /**
   * Off-chain source for human-readable validator names, used purely as a display
   * overlay on top of the trustless on-chain validator set. Each validator's name
   * is fetched from `${baseUrl}${key}.json` where `key` is a per-chain identifier
   * (e.g. Monad's secp pubkey). Absence simply means names are not enriched.
   *
   * Example (Monad): the governed `monad-developers/validator-info` repo, served
   * via an HTTPS endpoint, keyed by compressed secp pubkey hex.
   */
  validatorNameSource?: {
    baseUrl: string;
  };
  /** How to fetch active redelegations from an off-chain source. Defaults to `"none"` when absent. */
  redelegationStrategy?: RedelegationStrategy;
  /** How to fetch pending delegation rewards from an off-chain source. Defaults to `"none"` when absent. */
  rewardsStrategy?: RewardsStrategy;
  /** How to recover a REWARD op's amount from its tx receipt logs. Absent → REWARD ops keep their native value. */
  rewardsEventDecoder?: RewardsEventDecoder;
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
  /**
   * Fixed reserve (in wei) subtracted from the spendable balance when computing
   * the maximum delegation amount ("send all").  Decouples the computed amount
   * from gas-price fluctuations between prepareTransaction and broadcast.
   * Defaults to 0n when omitted.
   */
  delegationMaxAmountReserve?: bigint;
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
