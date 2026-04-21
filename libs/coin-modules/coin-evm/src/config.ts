import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { LedgerExplorerId } from "@ledgerhq/types-cryptoassets";

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
        /** Optional per-currency policy for handling explorer rate limiting headers. */
        rateLimitPolicy?:
          | {
              /** Header carrying remaining requests in the current rate-limit window. */
              remainingHeader?: string | undefined;
              /** Header carrying reset information for the current window. */
              resetHeader?: string | undefined;
              /**
               * Interpretation format of `resetHeader`.
               * - "ms": header value is milliseconds remaining until reset.
               * - "unix-seconds": header value is a Unix timestamp in seconds.
               */
              resetFormat?: "ms" | "unix-seconds" | undefined;
              /** Extra milliseconds to wait after reset, as a safety margin. */
              resetBufferMs?: number | undefined;
              /**
               * Proactive threshold. When remaining requests are <= this value,
               * we wait until reset before making the next request.
               */
              remainingThreshold?: number | undefined;
            }
          | undefined;
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
