import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { DistributionItem } from "@ledgerhq/types-live";
import {
  resolveDistributionItem,
  type DistributionLookup,
  type ResolveDistributionItemParams,
} from "../resolveDistributionItem";

const cryptoCurrency = (id: string): CryptoCurrency =>
  ({ id, type: "CryptoCurrency", name: id, ticker: id.toUpperCase() }) as unknown as CryptoCurrency;

const tokenCurrency = (id: string): TokenCurrency =>
  ({ id, type: "TokenCurrency", name: id, ticker: id }) as unknown as TokenCurrency;

const item = (
  currency: CryptoCurrency | TokenCurrency,
  networkIds: string[] = [],
): DistributionItem => ({
  currency,
  distribution: 0,
  amount: 0,
  accounts: [],
  networks: networkIds.length
    ? networkIds.map(id => ({ currency: tokenCurrency(id), accounts: [], amount: 0 }))
    : undefined,
});

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
    const btc = item(cryptoCurrency("bitcoin"));
    const result = resolveDistributionItem(
      base({
        decodedAssetId: "bitcoin",
        distribution: { bySlug: { bitcoin: btc }, list: [] },
      }),
    );
    expect(result).toBe(btc);
  });

  it("uses the raw route param as slug when decodedAssetId is not provided", () => {
    const btc = item(cryptoCurrency("bitcoin"));
    const result = resolveDistributionItem(
      base({
        routeAssetId: "bitcoin",
        distribution: { bySlug: { bitcoin: btc }, list: [] },
      }),
    );
    expect(result).toBe(btc);
  });

  it("falls back to slug derived from market ledger id", () => {
    const btc = item(cryptoCurrency("bitcoin"));
    const result = resolveDistributionItem(
      base({
        routeAssetId: "btc",
        distribution: { bySlug: { bitcoin: btc }, list: [] },
        marketState: { ledgerIds: ["urn:crypto:meta-currency:bitcoin"] },
      }),
    );
    expect(result).toBe(btc);
  });

  it("prefers decoded slug over market-derived slug", () => {
    const decoded = item(cryptoCurrency("bitcoin"));
    const fromMarket = item(cryptoCurrency("ethereum"));
    const result = resolveDistributionItem(
      base({
        decodedAssetId: "bitcoin",
        distribution: { bySlug: { bitcoin: decoded, ethereum: fromMarket }, list: [] },
        marketState: { ledgerIds: ["urn:crypto:meta-currency:ethereum"] },
      }),
    );
    expect(result).toBe(decoded);
  });

  it("matches a token with a slashed id by primary currency.id", () => {
    const usdc = item(tokenCurrency("ethereum/erc20/usd__coin"));
    const result = resolveDistributionItem(
      base({
        routeAssetId: "ethereum/erc20/usd__coin",
        decodedAssetId: "ethereum/erc20/usd__coin",
        distribution: { list: [usdc] },
      }),
    );
    expect(result).toBe(usdc);
  });

  it("matches via the item's networks list when only a network-specific id is given", () => {
    const usdt = item(cryptoCurrency("usdt"), [
      "ethereum/erc20/usd_tether__erc20_",
      "algorand/asa/312769",
    ]);
    const result = resolveDistributionItem(
      base({
        routeAssetId: "algorand/asa/312769",
        distribution: { list: [usdt] },
      }),
    );
    expect(result).toBe(usdt);
  });

  it("matches by market ledger id in the distribution list", () => {
    const btc = item(cryptoCurrency("bitcoin"));
    const result = resolveDistributionItem(
      base({
        routeAssetId: "unknown-slug",
        distribution: { list: [btc] },
        marketState: { ledgerIds: ["bitcoin"] },
      }),
    );
    expect(result).toBe(btc);
  });

  it("returns undefined when no source matches", () => {
    const eth = item(cryptoCurrency("ethereum"));
    const result = resolveDistributionItem(
      base({
        routeAssetId: "no-match",
        distribution: { bySlug: {}, list: [eth] },
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
    const distribution: DistributionLookup = {
      bySlug: { "": item(cryptoCurrency("ethereum")) },
      list: [],
    };
    const result = resolveDistributionItem(
      base({ routeAssetId: "unknown", distribution, marketState: undefined }),
    );
    expect(result).toBeUndefined();
  });
});
