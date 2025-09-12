import * as legacyTokens from "@ledgerhq/cryptoassets/tokens";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { setCryptoAssetsStoreGetter } from "../../cryptoAssetsStore";

/*
 * TODO change implementation when new CryptoAssesStore implemented with DADA
 */

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
setCryptoAssetsStoreForCoinFramework({
  findTokenByAddress: legacyTokens.findTokenByAddress,
  getTokenById: legacyTokens.getTokenById,
  findTokenById: legacyTokens.findTokenById,
  findTokenByAddressInCurrency: legacyTokens.findTokenByAddressInCurrency,
  findTokenByTicker: legacyTokens.findTokenByTicker,
} as CryptoAssetsStore);

setCryptoAssetsStoreGetter(
  () =>
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    ({
      findTokenByAddress: legacyTokens.findTokenByAddress,
      getTokenById: legacyTokens.getTokenById,
      findTokenById: legacyTokens.findTokenById,
      findTokenByAddressInCurrency: legacyTokens.findTokenByAddressInCurrency,
      findTokenByTicker: legacyTokens.findTokenByTicker,
    }) as CryptoAssetsStore,
);
