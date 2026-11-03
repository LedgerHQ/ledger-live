import { z } from "zod";
import {
  CRYPTO_CURRENCIES_IDS,
  CryptoCurrencyIdSchema,
  type CryptoCurrencyId,
} from "@domain/entity-currency-crypto";
import { UnknownNetworkError } from "./errors";

/** The CAL network id: `bitcoin`, `bitcoin_testnet`, `ethereum_sepolia`. Not a {@link CryptoCurrencyId}. */
export const NetworkIdSchema = z
  .string()
  .min(1)
  .regex(/^[^\s:]+$/, "Network id must not contain ':' or whitespace")
  .brand<"NetworkId">();

export type NetworkId = z.infer<typeof NetworkIdSchema>;

const KNOWN_NETWORKS: ReadonlySet<string> = new Set(CRYPTO_CURRENCIES_IDS);

function assertKnownNetwork(id: string): void {
  if (!KNOWN_NETWORKS.has(id)) throw new UnknownNetworkError(`Unknown network "${id}"`);
}

/** Bridge from a network id to its currency id, the same string for now. */
export function currencyIdFromNetwork(network: NetworkId): CryptoCurrencyId {
  assertKnownNetwork(network);
  return CryptoCurrencyIdSchema.parse(network);
}

/** Bridge from a currency id to its network id, the same string for now. */
export function networkFromCurrencyId(currencyId: CryptoCurrencyId): NetworkId {
  assertKnownNetwork(currencyId);
  return NetworkIdSchema.parse(currencyId);
}
