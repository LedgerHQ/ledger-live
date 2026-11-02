import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { bitcoin } from "./bitcoin";
import { evm } from "./evm";
import { generic } from "./generic";
import type { MockFamily } from "./types";

/** One entry per `CryptoCurrency.family` with its own mock. */
const FAMILIES: Partial<Record<string, MockFamily>> = { bitcoin, evm };

export const familyOf = (currency: CryptoCurrency): MockFamily =>
  FAMILIES[currency.family] ?? generic;
