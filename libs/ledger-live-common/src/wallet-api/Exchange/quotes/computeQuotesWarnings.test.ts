import { computeQuotesWarnings } from "./computeQuotesWarnings";
import { QuotesWarningCodes } from "./types";

describe("computeQuotesWarnings", () => {
  it("returns no warnings for non-Nano S devices", () => {
    const result = computeQuotesWarnings({
      deviceModelId: "nanoX",
      sendCurrencyId: "ton",
      receiveCurrencyId: "bitcoin",
    });

    expect(result).toEqual([]);
  });

  it("emits Nano S currency incompatibility for incompatible currencies", () => {
    const result = computeQuotesWarnings({
      deviceModelId: "nanoS",
      sendCurrencyId: "ton",
      receiveCurrencyId: "bitcoin",
    });

    expect(result).toEqual([
      {
        code: QuotesWarningCodes.NANO_S_CURRENCY_INCOMPATIBILITY,
        currencyId: "ton",
      },
    ]);
  });

  it("emits Nano S currency incompatibility for incompatible token parents", () => {
    const result = computeQuotesWarnings({
      deviceModelId: "nanoS",
      sendCurrencyId: "ethereum/erc20/usd_tether__erc20_",
      receiveCurrencyId: "bitcoin",
      sendParentCurrencyId: "solana",
    });

    expect(result).toEqual([
      {
        code: QuotesWarningCodes.NANO_S_CURRENCY_INCOMPATIBILITY,
        currencyId: "solana",
      },
    ]);
  });
});
