import { format } from "../currencyFormatter";
import { createMockMarketItemResponse } from "../fixtures";
import { KeysPriceChange } from "../types";

describe("currencyFormatter", () => {
  it("maps the six-month price change when the API provides it", () => {
    const formatted = format(createMockMarketItemResponse({ priceChangePercentage6m: 42.5 }));

    expect(formatted.priceChangePercentage[KeysPriceChange.sixMonths]).toBe(42.5);
  });
});
