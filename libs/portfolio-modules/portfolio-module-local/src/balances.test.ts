import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { getPortfolioBalance, toStakeInfo, toStakePosition } from "./balances";
import {
  aLocalNetwork,
  aStoredAccount,
  aStoredPortfolio,
  someDeps,
  type FakeNetwork,
} from "./test-utils";
import type { LocalNetwork, StoredAccount } from "./types";

const native = { type: "native" };
const usdc = {
  type: "erc20",
  assetReference: "0xusdc",
  name: "USD Coin",
  unit: { name: "USDC", code: "USDC", magnitude: 6 },
};
const state = { version: 1, data: null };

const setUp = async (
  accounts: StoredAccount[],
  fields: Partial<Pick<LocalNetwork, "resolveAsset">> = {},
) => {
  const bitcoin: FakeNetwork = aLocalNetwork(fields);
  const deps = someDeps({ networks: { bitcoin } });
  await deps.store.put(aStoredPortfolio({ accounts }));
  return { deps, bitcoin, getBalances: bitcoin.accountModule.getBalances };
};

const entry = (fields: object) => ({
  network: "bitcoin",
  account_id: "account",
  asset: "native",
  asset_info: { type: "native" },
  balance_index: 0,
  name: "Bitcoin",
  ticker: "BTC",
  decimals: 8,
  estimated: false,
  status: "confirmed",
  locked: false,
  ...fields,
});

const aStake = (fields: Partial<Stake> = {}): Stake => ({
  uid: "stake-1",
  address: "stake-account",
  state: "active",
  actions: [],
  asset: native,
  amount: 100n,
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
            entry({
              asset: "0xusdc",
              asset_info: { type: "erc20", assetReference: "0xusdc" },
              balance_index: 1,
              name: "USD Coin",
              ticker: "USDC",
              decimals: 6,
              amount: "7",
            }),
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

  it("puts the stake of a balance on its spendable entry only", async () => {
    const { deps, getBalances } = await setUp([aStoredAccount()]);
    const stake = aStake({ delegate: "validator", amount: 40n });
    getBalances.mockResolvedValue([
      { asset: native, value: 100n, locked: 40n },
      { asset: native, value: 40n, locked: 10n, stake },
    ]);

    const page = await getPortfolioBalance(deps, "portfolio");

    expect(page.items).toEqual([
      expect.objectContaining({
        items: [
          entry({ amount: "60" }),
          entry({ amount: "40", locked: true }),
          entry({ amount: "30", balance_index: 1, stake: toStakeInfo(stake) }),
          entry({ amount: "10", balance_index: 1, locked: true }),
        ],
      }),
    ]);
  });

  it("names an asset as its chain does: type, reference and issuer", async () => {
    const { deps, getBalances } = await setUp([aStoredAccount()]);
    getBalances.mockResolvedValue([
      { asset: native, value: 1n },
      { asset: { type: "credit", assetReference: "USDC", assetOwner: "issuer" }, value: 2n },
      { asset: { type: "native", assetReference: "policy.token" }, value: 3n },
      { asset: { type: "trc10", assetReference: "", assetOwner: "" }, value: 4n },
    ]);

    const page = await getPortfolioBalance(deps, "portfolio");

    const items = (page.items?.[0] as { items: Array<Record<string, unknown>> }).items;
    expect(
      items.map(({ asset, asset_info, balance_index }) => [asset, asset_info, balance_index]),
    ).toEqual([
      ["native", { type: "native" }, 0],
      ["USDC", { type: "credit", assetReference: "USDC", assetOwner: "issuer" }, 1],
      ["policy.token", { type: "native", assetReference: "policy.token" }, 2],
      ["trc10", { type: "trc10" }, 3],
    ]);
  });

  it("fills the catalog identity of a token through the client's lookup", async () => {
    const resolveAsset = jest.fn(async () => ({
      cal_id: "ethereum/erc20/usd_coin",
      name: "USD Coin (catalog)",
      ticker: "USDC",
      decimals: 6,
    }));
    const { deps, getBalances } = await setUp([aStoredAccount()], { resolveAsset });
    getBalances.mockResolvedValue([
      { asset: native, value: 1n },
      { asset: usdc, value: 7n, locked: 2n },
    ]);

    const page = await getPortfolioBalance(deps, "portfolio");

    expect(page.items).toEqual([
      expect.objectContaining({
        items: [
          entry({ amount: "1" }),
          expect.objectContaining({ cal_id: "ethereum/erc20/usd_coin", amount: "5" }),
          expect.objectContaining({ name: "USD Coin (catalog)", amount: "2", locked: true }),
        ],
      }),
    ]);
    expect(resolveAsset).toHaveBeenCalledTimes(1);
  });

  it("keeps the entries of the asset asked for, at their place in the network's list", async () => {
    const { deps, getBalances } = await setUp([aStoredAccount()]);
    getBalances.mockResolvedValue([
      { asset: native, value: 100n },
      { asset: usdc, value: 7n },
    ]);

    const page = await getPortfolioBalance(deps, "portfolio", { asset: "0xusdc" });

    expect(page.items).toEqual([
      expect.objectContaining({
        items: [expect.objectContaining({ asset: "0xusdc", amount: "7", balance_index: 1 })],
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

describe("toStakePosition", () => {
  it("keeps the stake as the network reports it, listing the defaulted fields it reports", () => {
    expect(
      toStakePosition(
        aStake({
          state: "withdrawable",
          actions: ["withdraw"],
          asset: { type: "native", name: "Solana", unit: undefined } as unknown as Stake["asset"],
          delegate: "validator",
          amountDeposited: 90n,
          amountRewarded: 10n,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          details: { activationEpoch: 7n, nested: { at: new Date("2026-01-02T00:00:00.000Z") } },
        }),
      ),
    ).toEqual({
      uid: "stake-1",
      state: "withdrawable",
      actions: ["withdraw"],
      asset_info: { type: "native", name: "Solana" },
      reported: ["delegate", "amount_deposited", "amount_rewarded", "created_at"],
      details: { activationEpoch: "7", nested: { at: "2026-01-02T00:00:00.000Z" } },
    });
  });

  it("reports nothing the stake leaves out, and no details without any", () => {
    expect(toStakePosition(aStake())).toEqual({
      uid: "stake-1",
      state: "active",
      actions: [],
      asset_info: { type: "native" },
      reported: [],
    });
  });
});

describe("toStakeInfo", () => {
  it("maps a stake to the service form, with its position", () => {
    const stake = aStake({
      delegate: "validator",
      amountDeposited: 90n,
      amountRewarded: 10n,
      stateUpdatedAt: new Date("2026-01-02T00:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(toStakeInfo(stake)).toEqual({
      address: "stake-account",
      delegate: "validator",
      state: "active",
      amount: "100",
      amount_deposited: "90",
      amount_rewarded: "10",
      state_updated_at: "2026-01-02T00:00:00.000Z",
      created_at: "2026-01-01T00:00:00.000Z",
      position: toStakePosition(stake),
    });
  });

  it("deposits what was not rewarded when the stake does not tell, and has no dates nor delegate", () => {
    expect(toStakeInfo(aStake({ amountRewarded: 15n }))).toEqual({
      address: "stake-account",
      delegate: "",
      state: "active",
      amount: "100",
      amount_deposited: "85",
      amount_rewarded: "15",
      created_at: "",
      position: expect.objectContaining({ reported: ["amount_rewarded"] }),
    });
    expect(toStakeInfo(aStake())).toMatchObject({
      amount_deposited: "100",
      amount_rewarded: "0",
    });
  });

  it.each([
    ["activating", "active"],
    ["active", "active"],
    ["deactivating", "unstaking"],
    ["withdrawable", "inactive"],
    ["inactive", "inactive"],
  ] as const)("maps the %s state to %s, keeping it in the position", (state, expected) => {
    const info = toStakeInfo(aStake({ state }));

    expect(info.state).toBe(expected);
    expect(info.position?.state).toBe(state);
  });
});
