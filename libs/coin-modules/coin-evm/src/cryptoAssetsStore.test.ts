import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import {
  CRYPTO_ASSETS_STORE_NO_SET_ERROR_MESSAGE,
  getCryptoAssetsStore,
  setCryptoAssetsStoreGetter,
} from "./cryptoAssetsStore";

describe("cryptoAssetsStore", () => {
  it("should throw an error when CryptoAssetsStoreGetter is not set", () => {
    expect(() => getCryptoAssetsStore()).toThrow(CRYPTO_ASSETS_STORE_NO_SET_ERROR_MESSAGE);
  });

  it("should return the CryptoAssetsStoreGetter set", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const store = {} as CryptoAssetsStore;
    setCryptoAssetsStoreGetter(() => store);
    expect(getCryptoAssetsStore()).toEqual(store);
  });
});
