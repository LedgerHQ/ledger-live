import { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { log } from "@ledgerhq/logs";
import type { InternalTxSourceList } from "./internalTxSources";

export type { InternalTxSource, InternalTxSourceList, NonEmptySource } from "./internalTxSources";
export {
  DEFAULT_INTERNAL_TX_SOURCES,
  internalTxSourcesFromList,
  isInternalTxSource,
} from "./internalTxSources";

/**
 * Block finalization levels supported by EVM JSON-RPC API, used to fetch the latest block.
 */
export type BlockFinalizationTag = "latest" | "safe" | "finalized";

export type NftStandard = "erc721" | "erc1155";

/** Fallbacks mirroring the `EXPLORER` / `EIP1559_BASE_FEE_MULTIPLIER` env defaults. */
export const DEFAULT_LEDGER_EXPLORER_URI = "https://explorers.api.live.ledger.com";
export const DEFAULT_EIP1559_BASE_FEE_MULTIPLIER = 1.6;

export type EvmConfig = {
  chainId: number;
  name: string;
  node:
    | {
        type: "external";
        uri: string;
        /** Number of retries for RPC calls. Defaults to 3 if not set. Set to 0 for no retries. */
        retries?: number;
      }
    | {
        type: "ledger";
        explorerId: string;
        /** Number of retries for Ledger explorer API calls. Defaults to 2 if not set. Set to 0 for no retries. */
        retries?: number;
      };
  explorer:
    | {
        type: "etherscan" | "blockscout" | "teloscan" | "klaytnfinder" | "corescan" | "cronos";
        noCache?: boolean | undefined;
        /**
         * Optional cap applied to the requested operation `limit` before the internal `limit + 1` probe.
         *
         * This is a pre-probe cap, not necessarily the explorer's advertised hard maximum page size.
         * If your explorer enforces a strict maximum page size `M`, set `maxLimit` to at most `M - 1`
         * so that the underlying `limit + 1` request never exceeds `M`.
         */
        maxLimit?: number | undefined;
        uri: string;
      }
    | {
        type: "ledger";
        explorerId: string;
        batchSize?: number | undefined;
      }
    | {
        type: "none";
        uri?: never;
        explorerId?: never;
      };
  gasTracker?: {
    type: "ledger";
    explorerId: string;
  };
  /**
   * NFT token standards to surface for this chain. Each standard is independent: an empty
   * array (or a standard being absent) disables the corresponding NFT operations. Replaces
   * the deprecated `showNfts` boolean and the `isNFTActive` env gate.
   */
  supportedTokens?: NftStandard[];
  /**
   * The block tag used to fetch the latest block. Defaults to "latest" if not set.
   * Use "safe" or "finalized" on chains where reorg protection is needed.
   */
  finalizationLevel?: BlockFinalizationTag;
  /**
   * ERC20 contract addresses that mirror the native balance and must be skipped when
   * computing token balances to avoid double-counting (e.g. Circle's Arc, where USDC
   * is the native unit of account exposed at a fixed ERC20 address).
   * Addresses are matched case-insensitively.
   */
  nativeContracts?: string[];
  /**
   * Minimum effective price per gas (in wei, decimal string) accepted by this chain's
   * mempool. Applied as a floor to both the legacy `gasPrice` and the EIP-1559
   * `maxPriorityFeePerGas`. Useful on sparse testnets where the network's effective
   * floor sits above what `eth_feeHistory` / `eth_gasPrice` reports, causing
   * underpriced transactions to be silently dropped.
   * 20 gwei example value: "20000000000"
   */
  minGasPrice?: string;
  /**
   * Number of blocks to request from `eth_feeHistory` when estimating priority fees.
   * Defaults to 5. Increase on chains with fast block times or sparse traffic so the
   * sample window covers enough transactions to be representative (e.g. a 0.5s-block
   * chain with 5 blocks only sees 2.5s of history, often not enough to surface a
   * meaningful priority fee). Most nodes cap this around 1024; keep well below.
   */
  feeHistoryBlockCount?: number;
  /**
   * Percentile (0-100) of priority fees actually paid per block to sample from
   * `eth_feeHistory`. Defaults to 50 (median). Higher values bias toward faster
   * inclusion at the cost of paying more; lower values bias toward minimal cost.
   */
  feeHistoryRewardPercentile?: number;
  /**
   * Calldata floor cost, used as a gas validation lower bound. Default to 10 and 1 (EIP-7623).
   * EIP-7976 raises them to 16 and 4, i.e. 64 gas per byte — set both, or zero-byte calldata is
   * under-estimated. 64 is the resulting gas per byte, not a value to set here.
   * @see https://eips.ethereum.org/EIPS/eip-7976
   */
  calldataFloorGasPerToken?: number;
  calldataFloorZeroByteTokens?: number;
  /** Base URL of the Ledger explorer API, for the `ledger` node/explorer/gasTracker. */
  ledgerExplorerUri?: string;
  /** `X-Ledger-Client-Version` header, which some Ledger APIs allowlist on. Unset = no header. */
  ledgerClientVersion?: string;
  /** Force type-0 (legacy) transactions instead of EIP-1559 ones. */
  forceLegacyTransactions?: boolean;
  /** Multiplier applied to the next base fee when composing `maxFeePerGas`. */
  eip1559BaseFeeMultiplier?: number;
  /**
   * Ordered list of internal-tx sources for `getBlock`. Built via `internalTxSourcesFromList()`.
   * Defaults to explorer-first, then node traces, then `empty` (resolves only when no
   * real trace runtime error was remembered; trace failures still propagate for retry).
   * @see https://ledgerhq.atlassian.net/wiki/spaces/CF/pages/7297957892
   */
  getBlockInternalTxsSources?: InternalTxSourceList;
};

export type ExternalNodeConfig = Extract<EvmConfig["node"], { type: "external" }>;
export type LedgerNodeConfig = Extract<EvmConfig["node"], { type: "ledger" }>;

export type EvmConfigInfo = CurrencyConfig & EvmConfig;

export type EvmCoinConfig = {
  info: EvmConfigInfo;
};

export type CoinConfig = (currencyId: string) => EvmCoinConfig;

let coinConfig: CoinConfig | undefined;

export const setCoinConfig = (config: CoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (currencyId: string): EvmCoinConfig => {
  if (!coinConfig) {
    throw new Error("EVM module config not set");
  }

  return coinConfig(currencyId);
};

/**
 * The {@link Context} threaded through the coin-evm public API (ADR-019).
 *
 * NOTE: The EVM low layers still resolve configuration through the module-level singleton
 * (keyed by `currency.id`), so `context` is currently threaded for framework conformance but
 * the config it carries mirrors the singleton. `config`/`logger` are provided for completeness
 * and for callers that build a context explicitly.
 */
export type EvmContext = Context<EvmConfigInfo>;

/**
 * Builds an {@link EvmContext} from the module-level singleton and `@ledgerhq/logs`.
 *
 * The returned `config` accessor reads from the singleton (`getCoinConfig`), preserving the
 * existing `setCoinConfig` side-effect flow used by external consumers of `createApi`.
 */
export const createContext = (): EvmContext => ({
  config: async (currencyId?: string): Promise<EvmConfigInfo> =>
    getCoinConfig(currencyId ?? "").info,
  logger: (...args: unknown[]): void => log("coin-evm", args.map(String).join(" ")),
});
