import { formatCardTransactionAmount } from "./formatCardTransactionAmount";

describe("formatCardTransactionAmount", () => {
  it("formats fiat with its actual currency", () => {
    expect(
      formatCardTransactionAmount({
        value: "-12.99",
        currency: "EUR",
        kind: "fiat",
        locale: "en-US",
      }),
    ).toContain("€");
  });

  it("does not treat BTC as a fiat countervalue", () => {
    expect(
      formatCardTransactionAmount({
        value: "-0.00005231",
        currency: "btc",
        kind: "crypto",
        locale: "en-US",
      }),
    ).toBe("-0.00005231\u00a0BTC");
  });

  it("does not round crypto amounts", () => {
    expect(
      formatCardTransactionAmount({
        value: "-0.12345678",
        currency: "BTC",
        kind: "crypto",
        locale: "en-US",
      }),
    ).toBe("-0.12345678\u00a0BTC");
  });

  it("keeps the sign on credits", () => {
    expect(
      formatCardTransactionAmount({
        value: "+12.99",
        currency: "EUR",
        kind: "fiat",
        locale: "en-US",
      }),
    ).toContain("+");
  });
});
