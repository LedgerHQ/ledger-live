import { anOperation } from "@ledgerhq/account-module-framework/test-utils";
import { PortfolioApiError, type BalanceHistoryPoint } from "@ledgerhq/portfolio-module-framework";
import { getPortfolioBalanceHistory } from "./balanceHistory";
import {
  aLocalNetwork,
  aStoredAccount,
  aStoredPortfolio,
  NOW,
  someDeps,
  type FakeNetwork,
} from "./test-utils";
import type { StoredAccount } from "./types";

const HOUR = 3_600_000;
const hoursAgo = (hours: number) => new Date(NOW - hours * HOUR);
const usdc = {
  type: "erc20",
  assetReference: "0xusdc",
  name: "USD Coin",
  unit: { name: "USDC", code: "USDC", magnitude: 6 },
};

const setUp = async (accounts: StoredAccount[] = [aStoredAccount()]) => {
  const bitcoin: FakeNetwork = aLocalNetwork();
  const deps = someDeps({ networks: { bitcoin } });
  await deps.store.put(aStoredPortfolio({ accounts }));
  return { deps, getBalances: bitcoin.accountModule.getBalances };
};

const valuesOf = (points: BalanceHistoryPoint[] | undefined, asset = "native") =>
  points?.filter(point => point.asset === asset).map(({ value }) => value);

describe("getPortfolioBalanceHistory", () => {
  it("samples the last day of each asset balance, computed back from the current one", async () => {
    const { deps, getBalances } = await setUp();
    getBalances.mockResolvedValue([
      { asset: { type: "native" }, value: 6n },
      { asset: { type: "native" }, value: 4n, locked: 4n },
    ]);
    await deps.store
      .history("account")
      .upsert([
        anOperation({ id: "in", type: "IN", value: 12n, date: hoursAgo(20.5) }),
        anOperation({ id: "out", type: "OUT", value: 2n, date: hoursAgo(2.5) }),
      ]);

    const page = await getPortfolioBalanceHistory(deps, "portfolio", { size: 100 });

    expect(page.items).toHaveLength(25);
    expect(page.items?.[0]).toEqual({
      network: "bitcoin",
      account_id: "account",
      asset: "native",
      name: "Bitcoin",
      ticker: "BTC",
      decimals: 8,
      time: "2026-01-09T00:00:00.000Z",
      value: "0",
    });
    expect(valuesOf(page.items)?.slice(3, 5)).toEqual(["0", "12"]);
    expect(valuesOf(page.items)?.slice(-4)).toEqual(["12", "10", "10", "10"]);
  });

  it("follows the assets of the history too, a token spent since included", async () => {
    const { deps } = await setUp();
    await deps.store
      .history("account")
      .upsert([
        anOperation({ id: "in", type: "IN", value: 4n, asset: usdc, date: hoursAgo(10) }),
        anOperation({ id: "out", type: "OUT", value: 4n, asset: usdc, date: hoursAgo(5) }),
      ]);

    const page = await getPortfolioBalanceHistory(deps, "portfolio", {
      asset: "0xusdc",
      range: "all",
    });

    expect(page.items).toEqual([
      expect.objectContaining({ asset: "0xusdc", ticker: "USDC", time: hoursAgo(0).toISOString() }),
    ]);
    expect(valuesOf(page.items, "0xusdc")).toEqual(["0"]);
  });

  it("orders by time, then account and asset, oldest first by default", async () => {
    const { deps, getBalances } = await setUp([
      aStoredAccount({ id: "b" }),
      aStoredAccount({ id: "a" }),
    ]);
    getBalances.mockResolvedValue([
      { asset: usdc, value: 1n },
      { asset: { type: "native" }, value: 1n },
    ]);
    const keysOf = (points: BalanceHistoryPoint[] | undefined) =>
      points?.map(({ account_id, asset }) => `${account_id}/${asset}`);

    const ascending = await getPortfolioBalanceHistory(deps, "portfolio", { size: 4 });
    const descending = await getPortfolioBalanceHistory(deps, "portfolio", {
      order: "DESC",
      size: 4,
    });

    expect(keysOf(ascending.items)).toEqual(["a/0xusdc", "a/native", "b/0xusdc", "b/native"]);
    expect(ascending.items?.[0]?.time).toBe("2026-01-09T00:00:00.000Z");
    expect(keysOf(descending.items)).toEqual(["b/native", "b/0xusdc", "a/native", "a/0xusdc"]);
    expect(descending.items?.[0]?.time).toBe(hoursAgo(0).toISOString());
  });

  it("filters by network and account, and pages 20 points at a time", async () => {
    const { deps, getBalances } = await setUp([
      aStoredAccount({ id: "a" }),
      aStoredAccount({ id: "b" }),
    ]);
    getBalances.mockResolvedValue([{ asset: { type: "native" }, value: 1n }]);

    const page = await getPortfolioBalanceHistory(deps, "portfolio", {
      network: "bitcoin",
      account: "b",
    });

    expect(page.items).toHaveLength(20);
    expect(page.nextToken).toBe("20");
    expect(new Set(page.items?.map(({ account_id }) => account_id))).toEqual(new Set(["b"]));
  });

  it("has no points for accounts that failed to register or are no longer served", async () => {
    const { deps, getBalances } = await setUp([
      aStoredAccount({ id: "a", status: "registration_failure" }),
      aStoredAccount({ id: "b", network: "litecoin" }),
    ]);

    expect(await getPortfolioBalanceHistory(deps, "portfolio")).toEqual({ items: [] });
    expect(getBalances).not.toHaveBeenCalled();
  });

  it("rejects an unknown portfolio as not found", async () => {
    await expect(getPortfolioBalanceHistory(someDeps(), "unknown")).rejects.toThrow(
      new PortfolioApiError("NOT_FOUND", "Portfolio unknown not found"),
    );
  });
});
