import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { LedgerExplorerId } from "@ledgerhq/types-cryptoassets";

/**
 * Block finalization levels supported by EVM JSON-RPC API, used to fetch the latest block.
 */
export type BlockFinalizationTag = "latest" | "safe" | "finalized";

export type EvmConfig = {
  node:
    | {
        type: "external";
        uri: string;
        /** Number of retries for RPC calls. Defaults to 3 if not set. Set to 0 for no retries. */
        retries?: number;
      }
    | {
        type: "ledger";
        explorerId: LedgerExplorerId;
        /** Number of retries for Ledger explorer API calls. Defaults to 2 if not set. Set to 0 for no retries. */
        retries?: number;
      };
  explorer:
    | {
        type: "etherscan" | "blockscout" | "teloscan" | "klaytnfinder" | "corescan";
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
        explorerId: LedgerExplorerId;
        batchSize?: number | undefined;
      }
    | {
        type: "none";
        uri?: never;
        explorerId?: never;
      };
  gasTracker?: {
    type: "ledger";
    explorerId: LedgerExplorerId;
  };
  showNfts: boolean;
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
