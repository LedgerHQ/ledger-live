import { mockMarketItemResponse } from "./marketItem.mock";
import { MarketItemListResponseSchema, MarketItemResponseSchema } from "./schema";

describe("MarketItemResponseSchema", () => {
  it("validates a well-formed raw item", () => {
    const item = mockMarketItemResponse();

    expect(MarketItemResponseSchema.parse(item)).toEqual(item);
  });

  it("accepts a null max supply, as the endpoint serves it for coins without a cap", () => {
    expect(
      MarketItemResponseSchema.safeParse({ ...mockMarketItemResponse(), maxSupply: null }).success,
    ).toBe(true);
  });

  it("accepts an item without currencyId or the 6-month change", () => {
    const {
      currencyId: _currencyId,
      priceChangePercentage6m: _sixMonths,
      ...item
    } = mockMarketItemResponse();

    expect(MarketItemResponseSchema.safeParse(item).success).toBe(true);
  });

  it("rejects an item without a price", () => {
    const { price: _price, ...item } = mockMarketItemResponse();

    expect(MarketItemResponseSchema.safeParse(item).success).toBe(false);
  });
});

describe("MarketItemListResponseSchema", () => {
  it("validates a list and keeps its order", () => {
    const parsed = MarketItemListResponseSchema.parse([
      mockMarketItemResponse({ id: "ethereum" }),
      mockMarketItemResponse({ id: "bitcoin" }),
    ]);

    expect(parsed.map(item => item.id)).toEqual(["ethereum", "bitcoin"]);
  });

  it("rejects a payload that is not a list", () => {
    expect(MarketItemListResponseSchema.safeParse({ unexpected: true }).success).toBe(false);
  });
});
