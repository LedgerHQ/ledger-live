import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "./currencies";
import type { TokenUnit } from "./cal-client/entities";

export interface ApiTokenData {
  id: string;
  contractAddress: string;
  name: string;
  ticker: string;
  units: TokenUnit[];
  standard: string;
  delisted?: boolean;
  disableCountervalue?: boolean;
  tokenIdentifier?: string;
  ledgerSignature?: string;
}

/**
 * Converts API token data to Ledger Live TokenCurrency format
 *
 * This function applies client-side transformations to reconcile differences between
 * backend APIs (CAL/DaDa) and Ledger Live's expected token format:
 *
 * @param apiToken - Token data from backend API
 * @returns TokenCurrency object in Ledger Live format, or undefined if parent currency not found
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

  // Apply client-side patches to reconcile CAL format with LL format
  const parentCurrencyId = id.split("/")[0];
  const parentCurrency = findCryptoCurrencyById(parentCurrencyId);

  if (!parentCurrency) {
    return undefined;
  }

  // Construct TokenCurrency directly from API data
  const tokenCurrency: TokenCurrency = {
    type: "TokenCurrency",
    id,
    contractAddress: contractAddress,
    parentCurrencyId,
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
  };

  // Add ledgerSignature if present
  if (ledgerSignature) {
    tokenCurrency.ledgerSignature = ledgerSignature;
  }

  return tokenCurrency;
}
