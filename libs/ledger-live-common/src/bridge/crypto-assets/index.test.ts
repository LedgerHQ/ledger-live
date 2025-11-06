import { getCryptoAssetsStore, setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";

describe("Testing CryptoAssetStore", () => {
  beforeEach(() => {
    // Reset the store before each test
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    setCryptoAssetsStore(undefined as unknown as CryptoAssetsStore);
  });

  it("should throw an error when no store is set", () => {
    expect(() => getCryptoAssetsStore()).toThrow("CryptoAssetsStore is not set");
  });

  it("should return the store when it is set", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const newStore = {} as unknown as CryptoAssetsStore;
    setCryptoAssetsStore(newStore);

    const store = getCryptoAssetsStore();
    expect(store).toBe(newStore);
  });

  it("should work with mock store", () => {
    const mockStore = setupMockCryptoAssetsStore();
    const store = getCryptoAssetsStore();
    expect(store).toBe(mockStore);
  });
});
