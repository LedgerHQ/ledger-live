import { LiveConfig } from "@ledgerhq/live-config/lib/LiveConfig";
import { CryptoAssetsStore, ERC20Token, SPLToken } from "./type";
import * as legacy from "@ledgerhq/cryptoassets/tokens";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

let cryptoAssetsStoreRef: CryptoAssetsStore | undefined = undefined;

export function setCryptoAssetsStore(store: CryptoAssetsStore) {
  cryptoAssetsStoreRef = store;
}

const legacyStore: CryptoAssetsStore = {
  findTokenByAddress: legacy.findTokenByAddress,
  getTokenById: legacy.getTokenById,
  addTokens: legacy.addTokens,
  convertERC20: convertERC20,
  findTokenById: legacy.findTokenById,
  findTokenByAddressInCurrency: legacy.findTokenByAddressInCurrency,
  findTokenByTicker: legacy.findTokenByTicker,
  convertSplTokens: convertSplTokens,
};

export function getCryptoAssetsStore(): CryptoAssetsStore | undefined {
  const featureEnabled = LiveConfig.getValueByKey("feature_cal_lazy_loading");
  if (!featureEnabled) {
    return legacyStore;
  }

  if (!cryptoAssetsStoreRef) {
    throw new Error("CryptoAssetsStore is not set. Please call setCryptoAssetsStore first.");
  }

  return cryptoAssetsStoreRef;
}

export function convertERC20(token: ERC20Token): TokenCurrency | undefined {
  return legacy.convertERC20([
    token.parentCurrencyId,
    token.token,
    token.ticker,
    token.magnitude,
    token.name,
    token.ledgerSignature,
    token.contractAddress,
    token.disableCountervalue,
    token.delisted,
  ]);
}

export function convertSplTokens(token: SPLToken): TokenCurrency {
  return legacy.convertSplTokens([
    token.id,
    token.network,
    token.name,
    token.symbol,
    token.address,
    token.decimals,
  ]);
}
