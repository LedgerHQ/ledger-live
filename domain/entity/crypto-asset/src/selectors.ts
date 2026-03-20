import type { CryptoAssetState, CurrencyId, Timestamp } from "./schema";

type WithCryptoAsset = { cryptoAsset: CryptoAssetState };

export const supportedCurrencyIdsSelector = (s: WithCryptoAsset): CurrencyId[] =>
  s.cryptoAsset.supportedCurrencyIds;

export const cryptoAssetLastSyncSelector = (s: WithCryptoAsset): Timestamp | null =>
  s.cryptoAsset.lastSync;
