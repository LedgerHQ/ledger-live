import type { CurrencyId, Timestamp } from "./schema";
import { mockCryptoAssetState } from "./schema.mock";
import {
  CRYPTO_ASSET_INITIAL_STATE,
  cryptoAssetReducer,
  setSupportedCurrencyIds,
  setLastSync,
  importState,
} from "./slice";

describe("cryptoAssetSlice", () => {
  it("has correct initial state", () => {
    const state = cryptoAssetReducer(undefined, { type: "@@INIT" });
    expect(state).toEqual(CRYPTO_ASSET_INITIAL_STATE);
  });

  describe("setSupportedCurrencyIds", () => {
    it("sets the supported currency ids", () => {
      const ids = ["bitcoin", "ethereum"] as CurrencyId[];
      const state = cryptoAssetReducer(CRYPTO_ASSET_INITIAL_STATE, setSupportedCurrencyIds(ids));
      expect(state.supportedCurrencyIds).toEqual(ids);
    });

    it("replaces existing ids", () => {
      const initial = mockCryptoAssetState();
      const newIds = ["polkadot"] as CurrencyId[];
      const state = cryptoAssetReducer(initial, setSupportedCurrencyIds(newIds));
      expect(state.supportedCurrencyIds).toEqual(newIds);
    });
  });

  describe("setLastSync", () => {
    it("sets a timestamp", () => {
      const ts = 1700000000000 as Timestamp;
      const state = cryptoAssetReducer(CRYPTO_ASSET_INITIAL_STATE, setLastSync(ts));
      expect(state.lastSync).toBe(ts);
    });

    it("sets null", () => {
      const initial = mockCryptoAssetState();
      const state = cryptoAssetReducer(initial, setLastSync(null));
      expect(state.lastSync).toBeNull();
    });
  });

  describe("importState", () => {
    it("replaces the entire state", () => {
      const replacement = mockCryptoAssetState({
        supportedCurrencyIds: ["cardano"] as CurrencyId[],
        lastSync: 999 as Timestamp,
      });
      const state = cryptoAssetReducer(CRYPTO_ASSET_INITIAL_STATE, importState(replacement));
      expect(state).toEqual(replacement);
    });
  });
});
