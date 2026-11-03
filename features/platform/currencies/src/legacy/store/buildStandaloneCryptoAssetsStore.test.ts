import { buildStandaloneCryptoAssetsStore } from "./buildStandaloneCryptoAssetsStore";

describe("buildStandaloneCryptoAssetsStore", () => {
  it("configures its own store and exposes the token accessors", () => {
    const store = buildStandaloneCryptoAssetsStore({
      calServiceUrl: "https://crypto-assets-service.test",
      ledgerClientVersion: "test/0.0.0",
    });

    expect(typeof store.findTokenById).toBe("function");
    expect(typeof store.findTokenByAddressInCurrency).toBe("function");
    expect(typeof store.getTokensSyncHash).toBe("function");
  });
});
