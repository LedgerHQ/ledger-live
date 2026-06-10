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
 * - Cardano: Reconstructs contractAddress from policyId + tokenIdentifier [LIVE-22559]
 * - Sui: Transforms tokenType from "coin" to "sui" [LIVE-22560]
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
    tokenIdentifier,
    ledgerSignature,
  } = apiToken;

  // Apply client-side patches to reconcile CAL format with LL format
  let patchedContractAddress = contractAddress;
  let patchedStandard = standard;

  const parentCurrencyId = id.split("/")[0];
  const parentCurrency = findCryptoCurrencyById(parentCurrencyId);

  if (!parentCurrency) {
    return undefined;
  }

  // LIVE-22559: Cardano - Reconstruct full assetId (policyId + assetName)
  if (standard === "native" && tokenIdentifier) {
    patchedContractAddress = contractAddress + tokenIdentifier;
  }

  // LIVE-22560: Sui - Transform "coin" standard to "sui" tokenType (LL format)
  if (standard === "coin" && id.startsWith("sui/")) {
    patchedStandard = "sui";
  }

  // Construct TokenCurrency directly from API data
  const tokenCurrency: TokenCurrency = {
    type: "TokenCurrency",
    id,
    contractAddress: patchedContractAddress,
    parentCurrency,
    tokenType: patchedStandard,
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
