import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Unit } from "@domain/entity-currency-unit";

export interface ApiTokenData {
  id: string;
  contractAddress: string;
  name: string;
  ticker: string;
  units: Unit[];
  standard: string;
  delisted?: boolean;
  disableCountervalue?: boolean;
  tokenIdentifier?: string;
  ledgerSignature?: string;
}

/**
 * Converts CAL token data to a {@link TokenCurrency}.
 *
 * Resolves the parent crypto currency from the static `@domain/entity-currency-crypto`
 * registry to derive `disableCountervalue` (testnet parents disable countervalues) and
 * to drop tokens whose parent currency is unknown.
 *
 * @returns
 * The token currency, or `undefined` when the parent currency is not found.
 */
export function convertApiToken(apiToken: ApiTokenData): TokenCurrency | undefined {
  const {
    standard,
    id,
    contractAddress,
    name,
    ticker,
    units,
    delisted = false,
    ledgerSignature,
  } = apiToken;

  const parentCurrencyId = id.split("/")[0];
  const parentCurrency = CRYPTO_CURRENCIES_REGISTRY[parentCurrencyId];

  if (!parentCurrency) {
    return undefined;
  }

  const tokenCurrency: TokenCurrency = {
    type: "TokenCurrency",
    id: id as TokenCurrency["id"],
    contractAddress,
    parentCurrencyId: parentCurrencyId as TokenCurrency["parentCurrencyId"],
    tokenType: standard,
    name,
    ticker,
    delisted,
    disableCountervalue: !!parentCurrency.isTestnetFor || !!apiToken.disableCountervalue,
    units: units.map(unit => ({
      name: unit.name,
      code: unit.code,
      magnitude: unit.magnitude,
    })),
    ...(ledgerSignature ? { ledgerSignature } : {}),
  };

  return tokenCurrency;
}
