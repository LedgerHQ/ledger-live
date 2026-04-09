import { z } from "zod";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

/**
 * A Network identifies a blockchain by name and environment.
 *
 * Examples:
 *   { name: "bitcoin",  env: "main"    }
 *   { name: "ethereum", env: "main"    }
 *   { name: "ethereum", env: "goerli"  }
 *   { name: "solana",   env: "devnet"  }
 *
 * `env` is "main" for mainnets. For testnets and devnets it is the suffix
 * from the live-common currencyId (e.g. "testnet", "devnet", "goerli", "sepolia").
 * The user-facing alias "mainnet" is normalised to "main" by parseNetworkArg().
 */
export const NetworkSchema = z.object({
  name: z.string().min(1),
  env: z.string().min(1),
});

export type Network = z.infer<typeof NetworkSchema>;

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

// ---------------------------------------------------------------------------
// Network ↔ live-common currencyId mapping
// ---------------------------------------------------------------------------

export class UnknownNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnknownNetworkError";
  }
}

/**
 * Convert a live-common currencyId to a Network.
 *
 * Uses CryptoCurrency.isTestnetFor to detect non-mainnet variants:
 *   "bitcoin"          → { name: "bitcoin",  env: "main" }
 *   "bitcoin_testnet"  → { name: "bitcoin",  env: "testnet" }  (isTestnetFor = "bitcoin")
 *   "solana_devnet"    → { name: "solana",   env: "devnet" }   (isTestnetFor = "solana")
 *   "ethereum_goerli"  → { name: "ethereum", env: "goerli" }   (isTestnetFor = "ethereum")
 *
 * Throws UnknownNetworkError if the currencyId is not known to @ledgerhq/cryptoassets.
 */
export function networkFromCurrencyId(currencyId: string): Network {
  let currency;
  try {
    currency = getCryptoCurrencyById(currencyId);
  } catch {
    throw new UnknownNetworkError(
      `Unknown currencyId "${currencyId}": not found in @ledgerhq/cryptoassets`,
    );
  }
  if (currency.isTestnetFor) {
    // e.g. bitcoin_testnet → { name: "bitcoin", env: "testnet" }
    const env = currencyId.slice(currency.isTestnetFor.length + 1);
    return { name: currency.isTestnetFor, env };
  }
  return { name: currencyId, env: "main" };
}

/**
 * Convert a Network to the corresponding live-common currencyId.
 *
 * Mapping rule:
 *   env === "main" → currencyId = network.name        (e.g. "ethereum")
 *   otherwise      → currencyId = name_env            (e.g. "bitcoin_testnet", "solana_devnet")
 *
 * Throws UnknownNetworkError if the resulting currencyId is not known.
 */
export function currencyIdFromNetwork(network: Network): string {
  const currencyId = network.env === "main" ? network.name : `${network.name}_${network.env}`;
  try {
    getCryptoCurrencyById(currencyId);
  } catch {
    throw new UnknownNetworkError(
      `No currency found for network "${network.name}:${network.env}" (tried currencyId "${currencyId}")`,
    );
  }
  return currencyId;
}
