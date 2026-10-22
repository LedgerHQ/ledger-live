import { UnknownNetworkError, type Network } from "@domain/entity-account-descriptor";
import { networkFromLegacy } from "./v1";

export {
  NetworkSchema,
  UnknownNetworkError,
  currencyIdFromNetwork,
  networkFromCurrencyId,
} from "@domain/entity-account-descriptor";
export type { Network } from "@domain/entity-account-descriptor";

/**
 * Parse a CLI network argument into a network id.
 *
 * Accepted forms:
 *   "ethereum"          → "ethereum"
 *   "bitcoin_testnet"   → "bitcoin_testnet"
 *   "Ethereum_Sepolia"  → "ethereum_sepolia"
 * and the deprecated version 1 `<name>:<env>` form:
 *   "ethereum:mainnet"  → "ethereum"
 *   "bitcoin:testnet"   → "bitcoin_testnet"
 */
export function parseNetworkArg(input: string): Network {
  const [name, env, ...extra] = input.toLowerCase().split(":");
  if (env === undefined) return name;
  if (!env || extra.length > 0) throw new UnknownNetworkError(`Unknown network "${input}"`);
  return networkFromLegacy(name, env === "mainnet" ? "main" : env);
}
