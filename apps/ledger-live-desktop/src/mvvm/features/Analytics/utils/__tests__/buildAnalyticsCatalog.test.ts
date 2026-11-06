import BigNumber from "bignumber.js";
import type { AssetsData } from "@domain/api-aggregated-assets";
import { mockArbitrumTokenAssetsData } from "@domain/api-aggregated-assets/mock";
import { AggregatedAssetIdSchema } from "@domain/entity-aggregated-asset";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import assetResponse from "tests/handlers/fixtures/assets/getAssets.json";
import { buildAnalyticsCatalog, selectEligibleAnalyticsPositions } from "../buildAnalyticsCatalog";
import { createAnalyticsAccount, createAnalyticsToken } from "../../__fixtures__/analyticsFixtures";

const eth = createAnalyticsAccount("analytics-catalog-eth");
const token = createAnalyticsToken(eth);
const parent = { ...eth, subAccounts: [token] };

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

describe("selectEligibleAnalyticsPositions", () => {
  it("should list native ETH without its tokens, then each token as its own position", () => {
    const positions = selectEligibleAnalyticsPositions([parent], [], { ethereum: 2 });
    expect(positions.map(p => p.id)).toEqual([eth.id, token.id]);
    expect(positions[0]).toMatchObject({ id: eth.id, subAccounts: undefined });
  });

  it("should include zero native ETH when confirmed token history makes its account eligible", () => {
    const zero = { ...parent, balance: new BigNumber(0), operations: [] };
    expect(selectEligibleAnalyticsPositions([zero], [], { ethereum: 2 }).map(p => p.id)).toEqual([
      eth.id,
      token.id,
    ]);
  });

  it("should exclude pending-only zero positions and blacklisted assets", () => {
    const pending = {
      ...eth,
      balance: new BigNumber(0),
      operations: [],
      pendingOperations: eth.operations,
    };
    expect(selectEligibleAnalyticsPositions([pending], [], { ethereum: 2 })).toEqual([]);
    expect(
      selectEligibleAnalyticsPositions([parent], [token.token.id], { ethereum: 2 }).map(p => p.id),
    ).toEqual([eth.id]);
  });
});

describe("buildAnalyticsCatalog", () => {
  it("should group cross-network ETH while keeping each account's network identity", () => {
    const base = createAnalyticsAccount("analytics-catalog-base", "base");
    const meta = assetResponse.cryptoAssets["urn:crypto:meta-currency:ethereum"];
    const metaId = AggregatedAssetIdSchema.parse(meta.id);
    const catalog = buildAnalyticsCatalog(
      [eth, base],
      [eth, base],
      { [eth.id]: "Savings", [base.id]: "Savings" },
      createAssetsData(
        { [metaId]: { ...meta, id: metaId, assetsIds: { ethereum: "ethereum", base: "base" } } },
        ["ethereum", "base"],
      ),
    );
    expect(catalog.assets).toHaveLength(1);
    expect(catalog.positions.map(p => p.accountId)).toEqual([eth.id, base.id]);
    expect(
      catalog.accounts.map(a => ({ name: a.name, iconId: a.iconId, ticker: a.ticker })),
    ).toEqual([
      { name: "Savings", iconId: "ethereum", ticker: "ETH" },
      { name: "Savings", iconId: "base", ticker: "ETH" },
    ]);
  });

  it("should fall back to the network name when an account has no name", () => {
    const catalog = buildAnalyticsCatalog([eth], [eth], {}, createAssetsData({}, []));
    expect(catalog.accounts.map(a => a.name)).toEqual(["Ethereum"]);
  });

  it("should keep native ETH on Arbitrum out of the ARB token group", () => {
    const native = createAnalyticsAccount("analytics-native-arbitrum", "arbitrum");
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
    expect(catalog.positions.map(p => p.assetId)).toEqual(["currency:arbitrum", "asset:arbitrum"]);
    expect(catalog.assets.map(asset => asset.ticker).sort()).toEqual(["ARB", "ETH"]);
  });
});
