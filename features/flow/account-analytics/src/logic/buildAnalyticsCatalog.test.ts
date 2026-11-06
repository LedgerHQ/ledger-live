import type { AssetsData } from "@domain/api-aggregated-assets";
import { mockArbitrumTokenAssetsData } from "@domain/api-aggregated-assets/mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  buildAnalyticsCatalog,
  createAnalyticsCatalogState,
  indexAnalyticsAccountNames,
  selectAnalyticsCurrencyIds,
} from "./buildAnalyticsCatalog";
import { createMockAccount, createMockToken } from "../analyticsSources.mock";

const eth = createMockAccount("catalog-eth");
const token = createMockToken(eth);
const ethereumMeta = {
  id: "urn:crypto:meta-currency:ethereum",
  ticker: "ETH",
  name: "Ethereum",
  assetsIds: { ethereum: "ethereum", base: "base" },
};

function createAssetsData(
  cryptoAssets: AssetsData["cryptoAssets"],
  currencyIds: readonly string[],
): AssetsData {
  return {
    cryptoAssets,
    networks: {},
    cryptoOrTokenCurrencies: Object.fromEntries(
      currencyIds.map(id => [id, getCryptoCurrencyById(id)]),
    ),
    interestRates: {},
    markets: {},
    currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: [] },
  };
}

const ethereumAssets = createAssetsData({ [ethereumMeta.id]: ethereumMeta }, ["ethereum", "base"]);

describe("buildAnalyticsCatalog", () => {
  it("should group cross-network ETH while keeping each account's network identity", () => {
    const base = createMockAccount("catalog-base", "base");
    const catalog = buildAnalyticsCatalog(
      [eth, base],
      [eth, base],
      { [eth.id]: "Savings", [base.id]: "Savings" },
      ethereumAssets,
    );
    expect(catalog.assets).toEqual([
      { id: `asset:${ethereumMeta.id}`, name: "Ethereum", ticker: "ETH", iconId: "ethereum" },
    ]);
    expect(catalog.positions.map(position => position.accountId)).toEqual([eth.id, base.id]);
    expect(
      catalog.accounts.map(({ name, iconId, ticker, address }) => ({
        name,
        iconId,
        ticker,
        address,
      })),
    ).toEqual([
      { name: "Savings", iconId: "ethereum", ticker: "ETH", address: eth.freshAddress },
      { name: "Savings", iconId: "base", ticker: "ETH", address: base.freshAddress },
    ]);
  });

  it("should fall back to the currency and the network name without metadata or account name", () => {
    const catalog = buildAnalyticsCatalog([eth], [eth], {}, createAssetsData({}, []));
    expect(catalog.assets.map(asset => asset.id)).toEqual(["currency:ethereum"]);
    expect(catalog.accounts.map(account => account.name)).toEqual(["Ethereum"]);
  });

  it("should attach a token position to its parent account", () => {
    const catalog = buildAnalyticsCatalog([token], [eth], {}, createAssetsData({}, []));
    expect(catalog.positions).toEqual([
      {
        positionId: token.id,
        accountId: eth.id,
        currencyId: token.token.id,
        assetId: `currency:${token.token.id}`,
      },
    ]);
    expect(catalog.accounts.map(account => account.id)).toEqual([eth.id]);
  });

  it("should keep native ETH on Arbitrum out of the ARB token group", () => {
    const native = createMockAccount("catalog-native-arbitrum", "arbitrum");
    const arbToken = {
      ...token,
      token: mockArbitrumTokenAssetsData.cryptoOrTokenCurrencies["ethereum/erc20/arbitrum"],
    };
    const catalog = buildAnalyticsCatalog(
      [native, arbToken],
      [eth, native],
      { [eth.id]: "Ethereum", [native.id]: "Arbitrum" },
      mockArbitrumTokenAssetsData,
    );
    expect(catalog.positions.map(position => position.assetId)).toEqual([
      "currency:arbitrum",
      "asset:arbitrum",
    ]);
    expect(catalog.assets.map(asset => asset.ticker).sort()).toEqual(["ARB", "ETH"]);
  });

  it("should sort assets by name", () => {
    const btc = createMockAccount("catalog-btc", "bitcoin");
    const catalog = buildAnalyticsCatalog([eth, btc], [eth, btc], {}, createAssetsData({}, []));
    expect(catalog.assets.map(asset => asset.name)).toEqual(["Bitcoin", "Ethereum"]);
  });
});

describe("selectAnalyticsCurrencyIds", () => {
  it("should list each currency once", () => {
    const base = createMockAccount("currency-base", "base");
    expect(selectAnalyticsCurrencyIds([eth, token, base, eth])).toEqual([
      "ethereum",
      token.token.id,
      "base",
    ]);
  });
});

describe("indexAnalyticsAccountNames", () => {
  it("should key each name by the account at the same index", () => {
    expect(indexAnalyticsAccountNames([{ id: "a" }, { id: "b" }], ["Savings", undefined])).toEqual({
      a: "Savings",
      b: undefined,
    });
  });
});

describe("createAnalyticsCatalogState", () => {
  const input = { positions: [eth], accounts: [eth], namesById: {} };

  it("should be ready and empty without any eligible position", () => {
    expect(
      createAnalyticsCatalogState({
        positions: [],
        accounts: [],
        namesById: {},
        assets: { data: undefined, isSuccess: false, isError: false },
      }),
    ).toEqual({ status: "ready", data: { assets: [], accounts: [], positions: [] } });
  });

  it("should build the catalog once asset metadata is loaded", () => {
    const state = createAnalyticsCatalogState({
      ...input,
      assets: { data: ethereumAssets, isSuccess: true, isError: false },
    });
    expect(state.status).toBe("ready");
  });

  it.each([
    [false, "loading"],
    [true, "error"],
  ] as const)("should report %s metadata failure as %s", (isError, status) => {
    expect(
      createAnalyticsCatalogState({
        ...input,
        assets: { data: undefined, isSuccess: false, isError },
      }),
    ).toEqual({ status });
  });
});
