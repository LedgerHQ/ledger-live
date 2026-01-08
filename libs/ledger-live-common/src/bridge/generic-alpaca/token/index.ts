import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import * as evmToken from "./evm";
import * as stellarToken from "./stellar";
import { AssetInfo } from "@ledgerhq/coin-framework/api/types";

export function getTokenFromAsset(network: string, currency: CryptoCurrency) {
  switch (network) {
    case "evm":
      return (asset: AssetInfo) => evmToken.getTokenFromAsset(currency, asset);
    case "stellar":
      return stellarToken.getTokenFromAsset;
    default:
      return undefined;
  }
}

export function getAssetFromToken(network: string, currency: CryptoCurrency) {
  switch (network) {
    case "evm":
      return (token: TokenCurrency, owner: string) =>
        evmToken.getAssetFromToken(currency, token, owner);
    case "stellar":
      return (token: TokenCurrency, _owner: string) => stellarToken.getAssetFromToken(token);
    default:
      return undefined;
  }
}
