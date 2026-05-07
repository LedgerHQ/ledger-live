import type { DistributionItem } from "@ledgerhq/types-live";
import { resolveMarketPriceCurrencyDataId } from "../utils/resolveMarketPriceCurrencyDataId";

describe("resolveMarketPriceCurrencyDataId", () => {
  it("normalizes a DADA-style market id on the prop", () => {
    expect(resolveMarketPriceCurrencyDataId("ethereum:erc20:usd_tether", undefined)).toBe(
      "usd-tether",
    );
  });

  it("prefers marketAssetId over distribution currency id", () => {
    const distribution = {
      currency: { id: "ethereum/erc20/usd__coin" },
    } as unknown as DistributionItem;
    expect(resolveMarketPriceCurrencyDataId("usd-coin", distribution)).toBe("usd-coin");
  });

  it("falls back to normalized distribution currency id when prop is missing", () => {
    const distribution = {
      currency: { id: "ethereum:erc20:usd_coin" },
    } as unknown as DistributionItem;
    expect(resolveMarketPriceCurrencyDataId(undefined, distribution)).toBe("usd-coin");
  });
});
