import { STAGING_ENV } from "./common";
import { findCurrencyData } from "./currencies";

describe("findCurrencyData", () => {
  it("returns all data in expected format", async () => {
    // Given
    const currencyId = "arbitrum";

    // When
    const currencies = await findCurrencyData(currencyId, STAGING_ENV);

    // Then
    expect(currencies).toEqual({
      id: currencyId,
      chainId: 42161,
      coinType: 60,
      config: "0345544808457468657265756d0d0345544812000000000000a4b1",
      signature:
        "30450221008ca557e4acc2fa290a6a44c2b0eb5232712ba69b23df93645a320bcff9789fd9022017e6e05582806a9d4b7b2aaaedbcc3471bd26e10ad686e4f313fc0b1068b5d64",
      symbol: "Ξ",
      ticker: "ETH",
      units: [
        {
          code: "wei",
          magnitude: 0,
          name: "wei",
        },
        {
          code: "Kwei",
          magnitude: 3,
          name: "Kwei",
        },
        {
          code: "Mwei",
          magnitude: 6,
          name: "Mwei",
        },
        {
          code: "Gwei",
          magnitude: 9,
          name: "Gwei",
        },
        {
          code: "ETH",
          magnitude: 18,
          name: "ether",
        },
      ],
    });
  });
});
