import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { base58 } from "../encoding";
import { randomBytes, type Random } from "../random";
import type { MockFamily } from "./types";

const address = (_currency: CryptoCurrency, random: Random) => base58(randomBytes(random, 32));

/** For a family without its own mock: a base58 address, read by the generic kinds only. */
export const generic: MockFamily = {
  descriptor: (currency, index, random) => ({
    purpose: "mock",
    version: "2",
    type: "address",
    network: currency.id,
    address: address(currency, random),
    path: `m/44h/${currency.coinType}h/${index}h/0/0`,
  }),
  address,
};
