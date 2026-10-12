import {
  currencyIdFromNetwork as currencyIdFromKnownNetwork,
  networkFromCurrencyId,
  type Network,
} from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  isWalletCliSupportedCurrency,
  listWalletCliSupportedCurrencyIds,
} from "../supported-currencies";

export {
  NetworkSchema,
  UnknownNetworkError,
  networkFromCurrencyId,
} from "@domain/entity-account-descriptor";
export type { Network } from "@domain/entity-account-descriptor";

// ---------------------------------------------------------------------------
// User-facing alias normalisation
// ---------------------------------------------------------------------------

/** Normalises user-facing env aliases to the canonical form. */
const ENV_ALIASES: Record<string, string> = {
  mainnet: "main",
};

function normalizeEnv(raw: string): string {
  return ENV_ALIASES[raw.toLowerCase()] ?? raw.toLowerCase();
}

/**
 * Parse a CLI network argument.
 *
 * Accepted forms:
 *   "ethereum"          → { name: "ethereum", env: "main" }   (no env = mainnet)
 *   "ethereum:mainnet"  → { name: "ethereum", env: "main" }
 *   "ethereum:main"     → { name: "ethereum", env: "main" }
 *   "bitcoin:testnet"   → { name: "bitcoin",  env: "testnet" }
 *   "solana:devnet"     → { name: "solana",   env: "devnet"  }
 *   "ethereum:goerli"   → { name: "ethereum", env: "goerli" }
 */
export function parseNetworkArg(input: string): Network {
  const colonIdx = input.indexOf(":");
  if (colonIdx === -1) {
    return { name: input.toLowerCase(), env: "main" };
  }
  return {
    name: input.slice(0, colonIdx).toLowerCase(),
    env: normalizeEnv(input.slice(colonIdx + 1)),
  };
}

/** Serialize a Network to its canonical string form, e.g. "ethereum:main". */
export function serializeNetwork(network: Network): string {
  return `${network.name}:${network.env}`;
}

/**
 * Shorthand for serializeNetwork(networkFromCurrencyId(currencyId)).
 * Converts a live-common currencyId directly to a canonical network string.
 * e.g. "bitcoin_testnet" → "bitcoin:testnet", "ethereum" → "ethereum:main"
 */
export function networkStringFromCurrencyId(currencyId: string): string {
  return serializeNetwork(networkFromCurrencyId(currencyId));
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
export function currencyIdFromNetwork(network: Network): string {
  const currencyId = currencyIdFromKnownNetwork(network);
  if (!isWalletCliSupportedCurrency(getCryptoCurrencyById(currencyId))) {
    throw new UnsupportedNetworkError(
      `Network "${serializeNetwork(network)}" is not supported by wallet-cli. Supported networks: ${listWalletCliSupportedCurrencyIds().join(", ")} (and their testnets).`,
    );
  }
  return currencyId;
}
