import {
  UnknownNetworkError,
  currencyIdFromNetwork as currencyIdFromKnownNetwork,
  networkFromCurrencyId,
  toNetworkId,
  type NetworkId,
} from "@domain/entity-account-descriptor";
import {
  CryptoCurrencyIdSchema,
  getCryptoCurrencyById,
  type CryptoCurrencyId,
} from "@domain/entity-currency-crypto";
import {
  isWalletCliSupportedCurrency,
  listWalletCliSupportedCurrencyIds,
} from "../supported-currencies";
import type { AccountDescriptorV0 } from "./v0";
import { networkFromLegacy } from "./v1";

export {
  NetworkIdSchema,
  UnknownNetworkError,
  networkFromCurrencyId,
  toNetworkId,
} from "@domain/entity-account-descriptor";
export type { NetworkId } from "@domain/entity-account-descriptor";

/** The network of a V0 descriptor; throws UnknownNetworkError for an empty or unknown currency id. */
export function networkOfV0(descriptor: Pick<AccountDescriptorV0, "currencyId">): NetworkId {
  const parsed = CryptoCurrencyIdSchema.safeParse(descriptor.currencyId);
  if (!parsed.success) {
    throw new UnknownNetworkError(`Unknown network "${descriptor.currencyId}"`);
  }
  return networkFromCurrencyId(parsed.data);
}

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
export function parseNetworkArg(input: string): NetworkId {
  return toNetworkId(normalizeNetworkArg(input));
}

/** {@link parseNetworkArg} without the network id check: only a malformed `<name>:<env>` form throws. */
export function normalizeNetworkArg(input: string): string {
  const [name, env, ...extra] = input.toLowerCase().split(":");
  if (env === undefined) return name;
  if (!env || extra.length > 0) throw new UnknownNetworkError(`Unknown network "${input}"`);
  return networkFromLegacy(name, env === "mainnet" ? "main" : env);
}

/** The mainnet a testnet network belongs to (`solana_devnet` → `solana`), else the network itself. */
export function mainnetOf(network: NetworkId): NetworkId {
  const mainnet = getCryptoCurrencyById(currencyIdFromKnownNetwork(network)).isTestnetFor;
  return mainnet === undefined ? network : toNetworkId(mainnet);
}

// ---------------------------------------------------------------------------
// Network → live-common currencyId mapping, restricted to wallet-cli support
// ---------------------------------------------------------------------------

export class UnsupportedNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedNetworkError";
  }
}

/**
 * Convert a Network to the corresponding live-common currencyId.
 *
 * Throws UnknownNetworkError if the resulting currencyId is not known.
 * Throws UnsupportedNetworkError if it is known but not supported by wallet-cli (e.g. "base").
 */
export function currencyIdFromNetwork(network: NetworkId): CryptoCurrencyId {
  const currencyId = currencyIdFromKnownNetwork(network);
  if (!isWalletCliSupportedCurrency(getCryptoCurrencyById(currencyId))) {
    throw new UnsupportedNetworkError(
      `Network "${network}" is not supported by wallet-cli. Supported networks: ${listWalletCliSupportedCurrencyIds().join(", ")} (and their testnets).`,
    );
  }
  return currencyId;
}
