import { format, formatPerformer } from "../currencyFormatter";
import { createMockMarketItemResponse } from "../fixtures";
import { KeysPriceChange } from "../types";

// The /v3/markets response returns `null` price changes for coins with too little history.
// Views call `.toFixed()` on these, so a null reaching them crashes the whole app.
const nullChanges = createMockMarketItemResponse({
  priceChangePercentage1h: null,
  priceChangePercentage24h: null,
  priceChangePercentage7d: null,
  priceChangePercentage30d: null,
  priceChangePercentage1y: null,
});

describe("currencyFormatter", () => {
  it("maps the six-month price change when the API provides it", () => {
    const formatted = format(createMockMarketItemResponse({ priceChangePercentage6m: 42.5 }));

    expect(formatted.priceChangePercentage[KeysPriceChange.sixMonths]).toBe(42.5);
  });

  it("formatPerformer coalesces null price changes to 0", () => {
    const performer = formatPerformer(nullChanges);

    expect(performer.priceChangePercentage1h).toBe(0);
    expect(performer.priceChangePercentage24h).toBe(0);
    expect(performer.priceChangePercentage7d).toBe(0);
    expect(performer.priceChangePercentage30d).toBe(0);
    expect(performer.priceChangePercentage1y).toBe(0);
  });

  it("format coalesces null price changes to 0", () => {
    const { priceChangePercentage } = format(nullChanges);

    expect(priceChangePercentage[KeysPriceChange.hour]).toBe(0);
    expect(priceChangePercentage[KeysPriceChange.day]).toBe(0);
    expect(priceChangePercentage[KeysPriceChange.week]).toBe(0);
    expect(priceChangePercentage[KeysPriceChange.month]).toBe(0);
    expect(priceChangePercentage[KeysPriceChange.year]).toBe(0);
  });
});
