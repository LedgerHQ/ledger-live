import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { DistributionItem } from "@ledgerhq/types-live";
import { resolveAssetMarketInputs } from "../resolveAssetMarketInputs";

const cryptoCurrency = (id: string): CryptoCurrency =>
  ({ id, type: "CryptoCurrency", name: id, ticker: id.toUpperCase() }) as unknown as CryptoCurrency;

const item = (
  currency: CryptoCurrency,
  overrides: Partial<DistributionItem> = {},
): DistributionItem => ({
  currency,
  distribution: 0,
  amount: 0,
  accounts: [],
  ...overrides,
});

describe("resolveAssetMarketInputs", () => {
  it("returns all undefined when no input is provided", () => {
    expect(resolveAssetMarketInputs({})).toEqual({
      marketApiId: undefined,
      knownLedgerIds: undefined,
      knownMarketId: undefined,
    });
  });

  it("prefers distributionItem.marketId over every other source", () => {
    const result = resolveAssetMarketInputs({
      distributionItem: item(cryptoCurrency("bsc"), {
        marketId: "binancecoin",
        slug: "binancecoin",
      }),
      marketState: { id: "another-id", ledgerIds: ["other"] },
      currency: cryptoCurrency("bsc"),
      fallbackId: "fallback",
    });

    expect(result.marketApiId).toBe("binancecoin");
  });

  it("falls back to distributionItem.slug when marketId is missing", () => {
    const result = resolveAssetMarketInputs({
      distributionItem: item(cryptoCurrency("bsc"), { slug: "binancecoin" }),
    });

    expect(result.marketApiId).toBe("binancecoin");
  });

  it("falls back to distributionItem.currency.id when marketId and slug are missing", () => {
    const result = resolveAssetMarketInputs({
      distributionItem: item(cryptoCurrency("bsc")),
      marketState: { id: "ignored" },
    });

    expect(result.marketApiId).toBe("bsc");
  });

  it("falls back to marketState.id when no distributionItem is provided", () => {
    const result = resolveAssetMarketInputs({
      marketState: { id: "binancecoin", ledgerIds: ["bsc"] },
      currency: cryptoCurrency("bsc"),
    });

    expect(result.marketApiId).toBe("binancecoin");
  });

  it("falls back to currency.id when no distribution and no marketState", () => {
    const result = resolveAssetMarketInputs({ currency: cryptoCurrency("bitcoin") });

    expect(result.marketApiId).toBe("bitcoin");
  });

  it("uses fallbackId as the last resort", () => {
    const result = resolveAssetMarketInputs({ fallbackId: "raw-route-id" });

    expect(result.marketApiId).toBe("raw-route-id");
  });

  it("prefers distributionItem.currency.id for knownLedgerIds", () => {
    const result = resolveAssetMarketInputs({
      distributionItem: item(cryptoCurrency("bsc")),
      marketState: { id: "binancecoin", ledgerIds: ["other"] },
      currency: cryptoCurrency("ignored"),
    });

    expect(result.knownLedgerIds).toEqual(["bsc"]);
  });

  it("falls back to currency.id for knownLedgerIds when no distributionItem", () => {
    const result = resolveAssetMarketInputs({
      marketState: { id: "binancecoin", ledgerIds: ["bsc"] },
      currency: cryptoCurrency("bsc"),
    });

    expect(result.knownLedgerIds).toEqual(["bsc"]);
  });

  it("uses marketState.ledgerIds when no distributionItem and no currency", () => {
    const result = resolveAssetMarketInputs({
      marketState: { id: "binancecoin", ledgerIds: ["bsc", "ethereum"] },
    });

    expect(result.knownLedgerIds).toEqual(["bsc", "ethereum"]);
  });

  it("returns marketState.id as knownMarketId", () => {
    const result = resolveAssetMarketInputs({
      marketState: { id: "binancecoin" },
    });

    expect(result.knownMarketId).toBe("binancecoin");
  });
});
