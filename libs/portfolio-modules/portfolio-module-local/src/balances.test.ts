import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { getPortfolioBalance } from "./balances";
import {
  aLocalNetwork,
  aStoredAccount,
  aStoredPortfolio,
  someDeps,
  type FakeNetwork,
} from "./test-utils";
import type { StoredAccount } from "./types";

const native = { type: "native" };
const usdc = {
  type: "erc20",
  assetReference: "0xusdc",
  name: "USD Coin",
  unit: { name: "USDC", code: "USDC", magnitude: 6 },
};
const state = { version: 1, data: null };

const setUp = async (accounts: StoredAccount[]) => {
  const bitcoin: FakeNetwork = aLocalNetwork();
  const deps = someDeps({ networks: { bitcoin } });
  await deps.store.put(aStoredPortfolio({ accounts }));
  return { deps, bitcoin, getBalances: bitcoin.accountModule.getBalances };
};

const entry = (fields: object) => ({
  network: "bitcoin",
  account_id: "account",
  asset: "native",
  name: "Bitcoin",
  ticker: "BTC",
  decimals: 8,
  estimated: false,
  status: "confirmed",
  locked: false,
  ...fields,
});

describe("getPortfolioBalance", () => {
  it("returns the account module balances of each account, spendable and locked", async () => {
    const { deps, bitcoin, getBalances } = await setUp([aStoredAccount({ state })]);
    getBalances.mockResolvedValue([
      { asset: native, value: 100n, locked: 30n },
      { asset: usdc, value: 7n },
    ]);

    expect(await getPortfolioBalance(deps, "portfolio")).toEqual({
      items: [
        {
          type: "success",
          network: "bitcoin",
          account_id: "account",
          items: [
            entry({ amount: "70" }),
            entry({ amount: "30", locked: true }),
            entry({ asset: "0xusdc", name: "USD Coin", ticker: "USDC", decimals: 6, amount: "7" }),
          ],
        },
      ],
    });
    expect(getBalances).toHaveBeenCalledWith(bitcoin.context, {
      descriptor: aStoredAccount().descriptor,
      state,
      history: deps.store.history("account"),
    });
  });

  it("keeps the entries of the asset asked for", async () => {
    const { deps, getBalances } = await setUp([aStoredAccount()]);
    getBalances.mockResolvedValue([
      { asset: native, value: 100n },
      { asset: usdc, value: 7n },
    ]);

    const page = await getPortfolioBalance(deps, "portfolio", { asset: "0xusdc" });

    expect(page.items).toEqual([
      expect.objectContaining({
        items: [expect.objectContaining({ asset: "0xusdc", amount: "7" })],
      }),
    ]);
  });

  it("reports the accounts that failed to register, or are no longer served, as failures", async () => {
    const { deps } = await setUp([
      aStoredAccount({ id: "a", status: "registration_failure", error: "not served" }),
      aStoredAccount({ id: "b", status: "registration_failure" }),
      aStoredAccount({ id: "c", network: "litecoin" }),
    ]);

    expect((await getPortfolioBalance(deps, "portfolio")).items).toEqual([
      { type: "failure", network: "bitcoin", account_id: "a", error: "not served" },
      { type: "failure", network: "bitcoin", account_id: "b", error: "Registration failure" },
      {
        type: "failure",
        network: "litecoin",
        account_id: "c",
        error: "litecoin is not served locally",
      },
    ]);
  });

  it("orders by account id, filters by network and account, and pages 20 at a time", async () => {
    const accounts = Array.from({ length: 21 }, (_, index) =>
      aStoredAccount({ id: `account-${String(index).padStart(2, "0")}` }),
    );
    const { deps } = await setUp([...accounts].reverse());
    const idsOf = (page: { items?: Array<{ account_id: string }> }) =>
      page.items?.map(({ account_id }) => account_id);

    const ascending = await getPortfolioBalance(deps, "portfolio");
    const descending = await getPortfolioBalance(deps, "portfolio", { order: "DESC", size: 2 });
    const filtered = await getPortfolioBalance(deps, "portfolio", {
      network: "bitcoin",
      account: "account-07",
    });

    expect(ascending.items).toHaveLength(20);
    expect(ascending.nextToken).toBe("20");
    expect(idsOf(ascending)?.slice(0, 2)).toEqual(["account-00", "account-01"]);
    expect(idsOf(descending)).toEqual(["account-20", "account-19"]);
    expect(idsOf(filtered)).toEqual(["account-07"]);
  });

  it("rejects an unknown portfolio as not found", async () => {
    await expect(getPortfolioBalance(someDeps(), "unknown")).rejects.toThrow(
      new PortfolioApiError("NOT_FOUND", "Portfolio unknown not found"),
    );
  });
});
