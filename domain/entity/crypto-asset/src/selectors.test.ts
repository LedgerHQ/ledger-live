import type { CryptoAssetState, CurrencyId, Timestamp } from "./schema";
import { mockCryptoAssetState } from "./schema.mock";
import { supportedCurrencyIdsSelector, cryptoAssetLastSyncSelector } from "./selectors";

function withCryptoAsset(state: CryptoAssetState) {
  return { cryptoAsset: state };
}

describe("supportedCurrencyIdsSelector", () => {
  it("returns supportedCurrencyIds from state", () => {
    const ids = ["bitcoin", "ethereum"] as CurrencyId[];
    const state = withCryptoAsset(mockCryptoAssetState({ supportedCurrencyIds: ids }));
    expect(supportedCurrencyIdsSelector(state)).toEqual(ids);
  });

  it("returns empty array from initial-like state", () => {
    const state = withCryptoAsset(
      mockCryptoAssetState({ supportedCurrencyIds: [] as CurrencyId[] }),
    );
    expect(supportedCurrencyIdsSelector(state)).toEqual([]);
  });
});

describe("cryptoAssetLastSyncSelector", () => {
  it("returns the lastSync timestamp", () => {
    const ts = 1700000000000 as Timestamp;
    const state = withCryptoAsset(mockCryptoAssetState({ lastSync: ts }));
    expect(cryptoAssetLastSyncSelector(state)).toBe(ts);
  });

  it("returns null when no sync has occurred", () => {
    const state = withCryptoAsset(mockCryptoAssetState({ lastSync: null }));
    expect(cryptoAssetLastSyncSelector(state)).toBeNull();
  });
});
