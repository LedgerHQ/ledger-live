import { findCurrencyData } from "./currencies";

describe("findCurrencyData", () => {
  it("returns all data in expected format", async () => {
    // Given
    const currencyId = "arbitrum";

    // When
    const currencies = await findCurrencyData(currencyId);

    // Then
    expect(currencies).toEqual({
      config: "0345544808457468657265756d0d0345544812000000000000a4b1",
      id: currencyId,
      signature:
        "30450221008ca557e4acc2fa290a6a44c2b0eb5232712ba69b23df93645a320bcff9789fd9022017e6e05582806a9d4b7b2aaaedbcc3471bd26e10ad686e4f313fc0b1068b5d64",
    });
  });
});
