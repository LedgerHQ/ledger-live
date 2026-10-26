import { z } from "zod";
import { CRYPTO_CURRENCIES_IDS } from "@domain/entity-currency-crypto";
import { UnknownNetworkError } from "./errors";

/** The CAL network id, for now the same as the currency id: `bitcoin`, `bitcoin_testnet`, `ethereum_sepolia`. */
export const NetworkSchema = z
  .string()
  .min(1)
  .regex(/^[^\s:]+$/, "Network id must not contain ':' or whitespace");

export type Network = z.infer<typeof NetworkSchema>;

const KNOWN_NETWORKS: ReadonlySet<string> = new Set(CRYPTO_CURRENCIES_IDS);

export function currencyIdFromNetwork(network: Network): string {
  if (!KNOWN_NETWORKS.has(network)) throw new UnknownNetworkError(`Unknown network "${network}"`);
  return network;
}

export const networkFromCurrencyId = (currencyId: string): Network =>
  currencyIdFromNetwork(currencyId);
