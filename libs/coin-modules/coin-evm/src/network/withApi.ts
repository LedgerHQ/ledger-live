import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { JsonRpcProvider, FetchRequest } from "ethers";
import { ExternalNodeConfig } from "../config";
import { withRetries } from "./withRetries";

export const RPC_TIMEOUT =
  process.env.NODE_ENV === "test"
    ? 100
    : /* istanbul ignore next: prod values don't change the behaviour of the test */ 5000; // wait 5 sec after a fail
export const DEFAULT_RETRIES_RPC_METHODS =
  process.env.NODE_ENV === "test"
    ? 1
    : /* istanbul ignore next: prod values don't change the behaviour of the test */ 3;

/**
 * Cache for RPC providers to avoid recreating the connection on every usage of `withApi`
 * Without this, ethers will create a new provider and use the `eth_chainId` RPC call
 * at instantiation which could result in rate limits being reached
 * on some specific nodes (E.g. the main Optimism RPC)
 * Keyed by currency id + RPC URI so the same chain with different uri gets distinct providers.
 */
export const PROVIDERS_BY_RPC: Record<string, JsonRpcProvider> = {};

function providerCacheKey(
  currencyId: string,
  uri: string,
  retryStrategy: RetryStrategy,
  retries: number,
): string {
  return `${currencyId}:${uri}:${retryStrategy}:${retries}`;
}

/**
 * Retry policy for API call on node
 *
 * Ethers has a built-in retry mechanism on http 429 status code, use `library` to use it only,
 * otherwise `application` to couple it with the application retries mechanism (function `withRetries`)
 */
export type RetryStrategy = "application" | "library";

function buildProvider(
  uri: string,
  retries: number,
  retryStrategy: RetryStrategy,
  chainId: number | undefined,
): JsonRpcProvider {
  const fetchRequest = new FetchRequest(uri);
  fetchRequest.setThrottleParams({
    // Math.max is only a safety net
    maxAttempts: retryStrategy === "library" ? Math.max(retries + 1, 1) : 1,
  });
  return new JsonRpcProvider(fetchRequest, chainId);
}

/**
 * Connects to RPC Node
 *
 * Uses a cached `JsonRpcProvider` initialized with the currency `chainId` when available.
 * Passing the chain id gives ethers a fixed network context and avoids an additional
 * `eth_chainId` network-detection call when the provider is created, which helps reduce
 * rate-limit pressure on some RPC nodes.
 */
export async function withApi<T>(
  currency: CryptoCurrency,
  execute: (api: JsonRpcProvider) => Promise<T>,
  nodeConfig: ExternalNodeConfig,
  retryStrategy: RetryStrategy = "application",
): Promise<T> {
  const retries = nodeConfig.retries ?? DEFAULT_RETRIES_RPC_METHODS;
  const fn = async (): Promise<T> => {
    const key = providerCacheKey(currency.id, nodeConfig.uri, retryStrategy, retries);
    if (!PROVIDERS_BY_RPC[key]) {
      PROVIDERS_BY_RPC[key] = buildProvider(
        nodeConfig.uri,
        retries,
        retryStrategy,
        currency.ethereumLikeInfo?.chainId,
      );
    }
    const provider = PROVIDERS_BY_RPC[key];
    return await execute(provider);
  };

  switch (retryStrategy) {
    case "library":
      return fn();
    default:
      return withRetries(fn, retries, RPC_TIMEOUT);
  }
}
