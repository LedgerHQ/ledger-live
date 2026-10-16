import { anOperation } from "@ledgerhq/account-module-framework/test-utils";
import { createMemoryPortfolioStore } from "./store";
import { aFailedAccount, aStoredAccount, aStoredPortfolio } from "./test-utils";

describe("createMemoryPortfolioStore", () => {
  it("returns nothing for an unknown portfolio", async () => {
    expect(await createMemoryPortfolioStore().get("unknown")).toBeUndefined();
  });

  it("returns copies, so that a caller mutating a portfolio does not change the stored one", async () => {
    const store = createMemoryPortfolioStore();
    const portfolio = aStoredPortfolio();
    await store.put(portfolio);
    portfolio.accounts = [];

    const read = await store.get("portfolio");
    read?.registrations.pop();

    expect(await store.get("portfolio")).toEqual(aStoredPortfolio());
  });

  it("keeps one history per account", async () => {
    const store = createMemoryPortfolioStore();
    await store.history("account-1").upsert([anOperation({ id: "op-1" })]);

    expect((await store.history("account-1").list()).items).toEqual([anOperation({ id: "op-1" })]);
    expect((await store.history("account-2").list()).items).toEqual([]);
  });

  it("finds an account by network and descriptor key, in any portfolio", async () => {
    const store = createMemoryPortfolioStore();
    await store.put(aStoredPortfolio({ id: "first" }));
    await store.put(
      aStoredPortfolio({
        id: "second",
        accounts: [
          aFailedAccount({ id: "failed" }),
          aStoredAccount({ id: "evm", network: "ethereum" }),
          aStoredAccount({ id: "btc" }),
        ],
      }),
    );

    expect(await store.findAccount("bitcoin", "key-btc")).toEqual({
      portfolioId: "second",
      accountId: "btc",
    });
    expect(await store.findAccount("bitcoin", "key-evm")).toBeUndefined();
    expect(await store.findAccount("bitcoin", "unknown")).toBeUndefined();
  });
});
