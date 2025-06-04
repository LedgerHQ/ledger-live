import type { CryptoCurrency, TokenCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import { BaseTokenLikeAsset } from "./buildSubAccounts";

/**
 * Constructs a TokenCurrency object from a token-like asset.
 * This function assumes the asset was previously normalized into the BaseTokenLikeAsset shape (or an extended one).
 */
export function buildTokenCurrency<T extends BaseTokenLikeAsset>({
  asset,
  parentCurrency,
  tokenType = "unknown",
}: {
  asset: T;
  parentCurrency: CryptoCurrency;
  tokenType?: string;
}): TokenCurrency {
  const ticker = asset.asset_code.toUpperCase();
  const name = `${parentCurrency.name} ${ticker}`;
  const id = `${parentCurrency.id}/token:${ticker}:${asset.asset_issuer}`;
  const contractAddress = asset.asset_issuer; // NOTE: Works for Stellar; for EVM, override asset_issuer to contractAddress
  const symbol = asset.asset_code;
  const magnitude = asset.decimals;

  const unit: Unit = {
    name: ticker,
    code: ticker,
    magnitude,
  };

  return {
    type: "TokenCurrency",
    id,
    parentCurrency,
    tokenType,
    contractAddress,
    ticker,
    name,
    units: [unit],
    symbol,
    keywords: [ticker, name],
  };
}
