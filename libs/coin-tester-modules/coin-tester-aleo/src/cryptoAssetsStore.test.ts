import { createCryptoAssetsStore } from "./cryptoAssetsStore";
import { USAD_TOKEN } from "./fixtures";

describe("createCryptoAssetsStore", () => {
  it("finds a token by id", async () => {
    const store = createCryptoAssetsStore([USAD_TOKEN]);
    await expect(store.findTokenById(USAD_TOKEN.id)).resolves.toBe(USAD_TOKEN);
    await expect(store.findTokenById("nope")).resolves.toBeUndefined();
  });

  it("finds a token by contract address within its parent currency", async () => {
    const store = createCryptoAssetsStore([USAD_TOKEN]);
    await expect(
      store.findTokenByAddressInCurrency(USAD_TOKEN.contractAddress, USAD_TOKEN.parentCurrencyId),
    ).resolves.toBe(USAD_TOKEN);
    await expect(
      store.findTokenByAddressInCurrency(USAD_TOKEN.contractAddress, "some_other_currency"),
    ).resolves.toBeUndefined();
  });

  it("returns a stable sync hash across calls", async () => {
    const store = createCryptoAssetsStore([USAD_TOKEN]);
    const [first, second] = await Promise.all([
      store.getTokensSyncHash(USAD_TOKEN.parentCurrencyId),
      store.getTokensSyncHash(USAD_TOKEN.parentCurrencyId),
    ]);
    expect(first).toBe(second);
  });

  it("returns an empty-list-consistent store when given no tokens", async () => {
    const store = createCryptoAssetsStore([]);
    await expect(store.findTokenById("anything")).resolves.toBeUndefined();
  });
});
