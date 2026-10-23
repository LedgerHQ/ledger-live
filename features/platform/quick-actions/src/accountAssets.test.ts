import {
  hasAnyFunds,
  listHeldAssets,
  resolveAssetsByAction,
  resolveAvailableAssetsByAction,
  sortAssetsByValue,
  sumAssetValues,
} from "./accountAssets";

const amount = (value: number) => ({ gt: (other: number) => value > other });
const token = (id: string, spendable: number) => ({
  token: { id },
  spendableBalance: amount(spendable),
});
const account = (spendable: { eth: number; usdc: number; pol: number }) => ({
  currency: { id: "ethereum" },
  spendableBalance: amount(spendable.eth),
  subAccounts: [token("usdc", spendable.usdc), token("pol", spendable.pol)],
});

const ids = (assets: readonly { currency: { id: string } }[]) =>
  assets.map(({ currency }) => currency.id);
const all = () => true;
const none = () => false;

describe("listHeldAssets", () => {
  it("lists the coin then its tokens, each token with the account as parent", () => {
    const eth = account({ eth: 1, usdc: 1, pol: 1 });
    const assets = listHeldAssets(eth, new Set());

    expect(ids(assets)).toEqual(["ethereum", "usdc", "pol"]);
    expect(assets[0]).toEqual({ currency: eth.currency, account: eth });
    expect(assets[1]).toEqual({
      currency: { id: "usdc" },
      account: eth.subAccounts[0],
      parentAccount: eth,
    });
  });

  it("leaves out blacklisted tokens", () => {
    expect(ids(listHeldAssets(account({ eth: 1, usdc: 1, pol: 1 }), new Set(["usdc"])))).toEqual([
      "ethereum",
      "pol",
    ]);
  });

  it("lists only the coin for an account without tokens", () => {
    const { subAccounts: _ignored, ...coinOnly } = account({ eth: 1, usdc: 0, pol: 0 });
    expect(ids(listHeldAssets(coinOnly, new Set()))).toEqual(["ethereum"]);
  });
});

describe("hasAnyFunds", () => {
  it("has funds when one asset has a spendable balance", () => {
    expect(hasAnyFunds(listHeldAssets(account({ eth: 0, usdc: 5, pol: 0 }), new Set()))).toBe(true);
  });

  it("has no funds when nothing is spendable", () => {
    expect(hasAnyFunds(listHeldAssets(account({ eth: 0, usdc: 0, pol: 0 }), new Set()))).toBe(
      false,
    );
  });
});

describe("resolveAssetsByAction", () => {
  const assets = listHeldAssets(account({ eth: 0, usdc: 5, pol: 2 }), new Set());

  it("lists every supported asset per action, with or without balance", () => {
    const byAction = resolveAssetsByAction(assets, {
      isBuyable: id => id !== "pol",
      isSellable: id => id !== "usdc",
      isSwappable: all,
      isStakeable: id => id === "ethereum",
    });

    expect(ids(byAction.buy)).toEqual(["ethereum", "usdc"]);
    expect(ids(byAction.sell)).toEqual(["ethereum", "pol"]);
    expect(ids(byAction.swap)).toEqual(["ethereum", "usdc", "pol"]);
    expect(ids(byAction.earn)).toEqual(["ethereum"]);
  });

  it("lists nothing for an action no asset supports", () => {
    const byAction = resolveAssetsByAction(assets, {
      isBuyable: none,
      isSellable: none,
      isSwappable: none,
      isStakeable: none,
    });

    expect(byAction).toEqual({ buy: [], sell: [], swap: [], earn: [] });
  });
});

describe("resolveAvailableAssetsByAction", () => {
  const assets = listHeldAssets(account({ eth: 1, usdc: 1, pol: 1 }), new Set());
  const sources = {
    buyableIds: ["ethereum", "usdc"],
    sellableIds: ["usdc"],
    swappableIds: ["ethereum", "pol"],
    deactivatedIds: new Set<string>(),
    isStakeable: (id: string) => id === "ethereum",
  };

  it("keeps, for each action, the assets listed by its source", () => {
    const byAction = resolveAvailableAssetsByAction(assets, sources);

    expect(ids(byAction.buy)).toEqual(["ethereum", "usdc"]);
    expect(ids(byAction.sell)).toEqual(["usdc"]);
    expect(ids(byAction.swap)).toEqual(["ethereum", "pol"]);
    expect(ids(byAction.earn)).toEqual(["ethereum"]);
  });

  it("drops deactivated currencies from every action", () => {
    const byAction = resolveAvailableAssetsByAction(assets, {
      ...sources,
      deactivatedIds: new Set(["ethereum"]),
    });

    expect(ids(byAction.buy)).toEqual(["usdc"]);
    expect(ids(byAction.swap)).toEqual(["pol"]);
    expect(byAction.earn).toEqual([]);
  });
});

describe("sortAssetsByValue", () => {
  it("orders assets by value, highest first, keeping ties in place", () => {
    const values: Record<string, number> = { a: 1, b: 10, c: 1, d: 5 };
    const sorted = sortAssetsByValue(["a", "b", "c", "d"], id => values[id]);

    expect(sorted).toEqual(["b", "d", "a", "c"]);
  });
});

type Asset = Readonly<{ balance: number; value?: number }>;
const sum = (assets: readonly Asset[]) =>
  sumAssetValues(
    assets,
    ({ balance }) => balance > 0,
    ({ value }) => value,
  );

describe("sumAssetValues", () => {
  it("is zero when every asset is empty", () => {
    expect(sum([{ balance: 0 }, { balance: 0 }])).toBe(0);
  });

  it("is unknown when no funded asset has a value, even next to empty ones", () => {
    expect(sum([{ balance: 0, value: 0 }, { balance: 5 }])).toBeUndefined();
  });

  it("adds the values of the funded assets that have one", () => {
    expect(
      sum([
        { balance: 0, value: 0 },
        { balance: 5, value: 10 },
        { balance: 2 },
        { balance: 1, value: 3 },
      ]),
    ).toBe(13);
  });
});
