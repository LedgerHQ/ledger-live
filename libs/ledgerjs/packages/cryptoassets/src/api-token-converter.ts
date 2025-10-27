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
 * Transforms Ledger Live token ID to backend API format for querying
 *
 * This handles cases where LL uses different ID conventions than backend APIs.
 * Applied BEFORE querying the API to ensure the request uses the correct format:
 *
 * - MultiversX: multiversx/esdt/* → elrond/esdt/* (API uses old name) [LIVE-22557]
 * - Stellar: UPPERCASE → lowercase (API uses lowercase) [LIVE-22558]
 *
 * @param legacyId - Token ID in Ledger Live format
 * @returns Token ID in backend API format
 */
export function legacyIdToApiId(legacyId: string): string {
  let apiId = legacyId;

  // LIVE-22557: MultiversX - API uses old "elrond" name
  if (apiId.startsWith("multiversx/esdt/")) {
    apiId = apiId.replace("multiversx/esdt/", "elrond/esdt/");
  }

  // LIVE-22558: Stellar - API uses all lowercase (including the address part)
  if (apiId.startsWith("stellar/asset/")) {
    apiId = apiId.toLowerCase();
  }

  return apiId;
}

/**
 * Converts API token data to Ledger Live TokenCurrency format
 *
 * This function applies client-side transformations to reconcile differences between
 * backend APIs (CAL/DaDa) and Ledger Live's expected token format:
 *
 * - MultiversX: elrond/esdt/* → multiversx/esdt/* [LIVE-22557]
 * - Stellar: Normalizes casing to stellar/asset/UPPERCASE_ADDRESS and tokenType asset → stellar [LIVE-22558]
 * - Cardano: Reconstructs contractAddress from policyId + tokenIdentifier [LIVE-22559]
 * - Sui: Transforms tokenType from "coin" to "sui" [LIVE-22560]
 * - TON Jetton: Removes name prefix from ID (ton/jetton/name_address → ton/jetton/address) [LIVE-22561]
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
  let patchedId = id;
  let patchedContractAddress = contractAddress;
  let patchedStandard = standard;

  // Get parent currency from the ORIGINAL ID (before transformation)
  // This is important for currencies that changed names (elrond -> multiversx)
  const parentCurrencyId = id.split("/")[0];
  const parentCurrency = findCryptoCurrencyById(parentCurrencyId);

  if (!parentCurrency) {
    return undefined;
  }

  // LIVE-22557: MultiversX - Transform elrond/* to multiversx/*
  if (patchedId.startsWith("elrond/esdt/")) {
    patchedId = patchedId.replace("elrond/esdt/", "multiversx/esdt/");
  }

  // LIVE-22558: Stellar - Transform to LL mixed-case format: stellar/asset/ + UPPERCASE_REST
  // Also fix tokenType: API returns "asset", LL expects "stellar"
  const stellarPrefix = "stellar/asset/";
  if (patchedId.toLowerCase().startsWith(stellarPrefix)) {
    const rest = patchedId.substring(stellarPrefix.length);
    patchedId = stellarPrefix + rest.toUpperCase();
    patchedStandard = patchedStandard === "asset" ? "stellar" : patchedStandard;
  }

  // LIVE-22559: Cardano - Reconstruct full assetId (policyId + assetName)
  if (standard === "native" && tokenIdentifier) {
    patchedContractAddress = contractAddress + tokenIdentifier;
  }

  // LIVE-22560: Sui - Transform "coin" standard to "sui" tokenType (LL format)
  if (standard === "coin" && patchedId.startsWith("sui/")) {
    patchedStandard = "sui";
  }

  // LIVE-22561: TON Jetton - Remove name prefix from ID (API: ton/jetton/name_address -> LL: ton/jetton/address)
  if (patchedId.startsWith("ton/jetton/") && patchedId.indexOf("_") > 0) {
    const parts = patchedId.split("_");
    if (parts.length === 2) {
      patchedId = "ton/jetton/" + parts[1];
    }
  }

  // Construct TokenCurrency directly from API data
  const tokenCurrency: TokenCurrency = {
    type: "TokenCurrency",
    id: patchedId,
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
