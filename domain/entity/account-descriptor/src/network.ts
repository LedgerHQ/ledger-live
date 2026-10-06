import { z } from "zod";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { UnknownNetworkError } from "./errors";

/** A blockchain by name and environment; `env` is `main` or the testnet suffix of the currency id. */
/** `:` is the separator of the serialized descriptor, so it cannot appear in a field. */
const NetworkFieldSchema = z
  .string()
  .min(1)
  .refine(v => !v.includes(":"), { message: "Network fields must not contain ':'" });

export const NetworkSchema = z.object({
  name: NetworkFieldSchema,
  env: NetworkFieldSchema,
});

export type Network = z.infer<typeof NetworkSchema>;

/** "bitcoin_testnet" -> { name: "bitcoin", env: "testnet" }, "ethereum" -> { name: "ethereum", env: "main" } */
export function networkFromCurrencyId(currencyId: string): Network {
  let currency;
  try {
    currency = getCryptoCurrencyById(currencyId);
  } catch {
    throw new UnknownNetworkError(
      `Unknown currencyId "${currencyId}": not found in currency registry`,
    );
  }
  const parentPrefix = currency.isTestnetFor ? `${currency.isTestnetFor}_` : undefined;
  if (currency.isTestnetFor && parentPrefix && currency.id.startsWith(parentPrefix)) {
    return { name: currency.isTestnetFor, env: currency.id.slice(parentPrefix.length) };
  }
  return { name: currency.id, env: "main" };
}

/** { name: "bitcoin", env: "testnet" } -> "bitcoin_testnet", env "main" -> the bare name. Case-insensitive. */
export function currencyIdFromNetwork(network: Network): string {
  const name = network.name.toLowerCase();
  const env = network.env.toLowerCase();
  const currencyId = env === "main" ? name : `${name}_${env}`;
  try {
    return getCryptoCurrencyById(currencyId).id;
  } catch {
    throw new UnknownNetworkError(
      `No currency found for network "${network.name}:${network.env}" (tried currencyId "${currencyId}")`,
    );
  }
}
