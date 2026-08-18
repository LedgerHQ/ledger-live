import {
  getCryptoAssetsStore,
  setCryptoAssetsStore,
  type FrameworkCryptoAssetsStore,
} from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

describe("Testing CryptoAssetStore", () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    setCryptoAssetsStore(undefined as unknown as FrameworkCryptoAssetsStore);
  });

  it("should throw an error when no store is set", () => {
    expect(() => getCryptoAssetsStore()).toThrow(
      "Framework crypto assets store not initialized. Call setCryptoAssetsStore() at bootstrap.",
    );
  });

  it("should return the store when it is set", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const newStore = {} as unknown as FrameworkCryptoAssetsStore;
    setCryptoAssetsStore(newStore);

    const store = getCryptoAssetsStore();
    expect(store).toBe(newStore);
  });
});
