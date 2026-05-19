import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import {
  buildDistributionItem,
  makeIntegrationTokenCurrency,
} from "tests/utils/distributionTestUtils";
import {
  resolveDistributionItem,
  type DistributionLookup,
  type ResolveDistributionItemParams,
} from "../resolveDistributionItem";

const btc = getCryptoCurrencyById("bitcoin");
const eth = getCryptoCurrencyById("ethereum");

const emptyDistribution: DistributionLookup = { bySlug: {}, list: [] };

const base = (
  overrides: Partial<ResolveDistributionItemParams> = {},
): ResolveDistributionItemParams => ({
  routeAssetId: "bitcoin",
  decodedAssetId: undefined,
  marketState: undefined,
  distribution: emptyDistribution,
  ...overrides,
});

describe("resolveDistributionItem", () => {
  it("returns undefined when no route param is provided", () => {
    expect(resolveDistributionItem(base({ routeAssetId: undefined }))).toBeUndefined();
  });

  it("finds the item by decoded asset slug", () => {
    const item = buildDistributionItem({ currency: btc });
    const result = resolveDistributionItem(
      base({
        decodedAssetId: "bitcoin",
        distribution: { bySlug: { bitcoin: item }, list: [] },
      }),
    );
    expect(result).toBe(item);
  });

  it("uses the raw route param as slug when decoding is unnecessary", () => {
    const item = buildDistributionItem({ currency: btc });
    const result = resolveDistributionItem(
      base({
        routeAssetId: "bitcoin",
        decodedAssetId: undefined,
        distribution: { bySlug: { bitcoin: item }, list: [] },
      }),
    );
    expect(result).toBe(item);
  });

  it("falls back to slug derived from market ledger id", () => {
    const item = buildDistributionItem({ currency: btc });
    const result = resolveDistributionItem(
      base({
        routeAssetId: "btc",
        distribution: { bySlug: { bitcoin: item }, list: [] },
        marketState: { ledgerIds: ["urn:crypto:meta-currency:bitcoin"] },
      }),
    );
    expect(result).toBe(item);
  });

  it("prefers decoded slug over market-derived slug", () => {
    const decodedItem = buildDistributionItem({ currency: btc });
    const slugItem = buildDistributionItem({ currency: eth });
    const result = resolveDistributionItem(
      base({
        decodedAssetId: "bitcoin",
        distribution: { bySlug: { bitcoin: decodedItem, ethereum: slugItem }, list: [] },
        marketState: { ledgerIds: ["urn:crypto:meta-currency:ethereum"] },
      }),
    );
    expect(result).toBe(decodedItem);
  });

  it("matches a token with a slashed id from the distribution list", () => {
    const usdc = makeIntegrationTokenCurrency("ethereum/erc20/usd__coin", "USDC", "USD Coin");
    const item = buildDistributionItem({ currency: usdc });
    const result = resolveDistributionItem(
      base({
        routeAssetId: "ethereum/erc20/usd__coin",
        decodedAssetId: "ethereum/erc20/usd__coin",
        distribution: { list: [item] },
      }),
    );
    expect(result).toBe(item);
  });

  it("matches by market ledger id in the distribution list", () => {
    const item = buildDistributionItem({ currency: btc });
    const result = resolveDistributionItem(
      base({
        routeAssetId: "unknown-slug",
        distribution: { list: [item] },
        marketState: { ledgerIds: [btc.id] },
      }),
    );
    expect(result).toBe(item);
  });

  it("returns undefined when no source matches", () => {
    const unrelated = buildDistributionItem({ currency: eth });
    const result = resolveDistributionItem(
      base({
        routeAssetId: "no-match",
        distribution: { bySlug: {}, list: [unrelated] },
      }),
    );
    expect(result).toBeUndefined();
  });

  it("handles missing market state gracefully", () => {
    expect(() => resolveDistributionItem(base({ marketState: undefined }))).not.toThrow();
  });

  it("handles empty ledger ids gracefully", () => {
    expect(() => resolveDistributionItem(base({ marketState: { ledgerIds: [] } }))).not.toThrow();
  });

  it("skips slug lookup when no market ledger id exists", () => {
    const emptyKeyItem = buildDistributionItem({ currency: eth });
    const distribution: DistributionLookup = {
      bySlug: { "": emptyKeyItem },
      list: [],
    };
    const result = resolveDistributionItem(
      base({ routeAssetId: "unknown", distribution, marketState: undefined }),
    );
    expect(result).toBeUndefined();
  });
});
