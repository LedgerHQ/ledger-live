/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { AssetDetailMarketInfo } from "@ledgerhq/asset-detail";
import type { DistributionItem } from "@ledgerhq/types-live";
import { resolveMarketPriceSectionSourceId } from "../utils/resolveMarketPriceSectionSourceId";

describe("resolveMarketPriceSectionSourceId", () => {
  it("returns undefined when no source is available", () => {
    expect(
      resolveMarketPriceSectionSourceId({
        marketInfo: undefined,
        distributionItem: undefined,
        ledgerId: undefined,
      }),
    ).toBeUndefined();
  });

  it("prefers marketInfo.id", () => {
    const marketInfo = { id: "usd-coin", ledgerIds: [] } as AssetDetailMarketInfo;
    const distribution = {
      marketId: "ignored",
      currency: { id: "ethereum/erc20/usd__coin" },
    } as unknown as DistributionItem;
    expect(
      resolveMarketPriceSectionSourceId({
        marketInfo,
        distributionItem: distribution,
        ledgerId: "ledger-fallback",
      }),
    ).toBe("usd-coin");
  });

  it("falls back to distribution marketId then currency id then ledgerId", () => {
    const distribution = {
      marketId: "usd-coin",
      currency: { id: "ethereum/erc20/usd__coin" },
    } as unknown as DistributionItem;
    expect(
      resolveMarketPriceSectionSourceId({
        marketInfo: undefined,
        distributionItem: distribution,
        ledgerId: undefined,
      }),
    ).toBe("usd-coin");

    expect(
      resolveMarketPriceSectionSourceId({
        marketInfo: undefined,
        distributionItem: { currency: { id: "only-currency" } } as unknown as DistributionItem,
        ledgerId: undefined,
      }),
    ).toBe("only-currency");

    expect(
      resolveMarketPriceSectionSourceId({
        marketInfo: undefined,
        distributionItem: undefined,
        ledgerId: "bitcoin",
      }),
    ).toBe("bitcoin");
  });
});
