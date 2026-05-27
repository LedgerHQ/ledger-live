import { counterValueFormatter } from "../countervalueFormatter";

describe("counterValueFormatter (live-common)", () => {
  it("returns '-' for falsy values", () => {
    expect(counterValueFormatter({ value: 0, locale: "en-US" })).toBe("-");
    expect(counterValueFormatter({ value: undefined, locale: "en-US" })).toBe("-");
  });

  it("formats a currency value", () => {
    const result = counterValueFormatter({
      value: 1234.56,
      locale: "en-US",
      currency: "USD",
    });
    expect(result).toContain("$");
    expect(result).toContain("1,234.56");
  });

  it("formats in compact notation when shorten is true", () => {
    const result = counterValueFormatter({
      value: 21_000_000,
      locale: "en-US",
      shorten: true,
    });
    expect(result).toMatch(/21M/i);
  });

  it("appends an uppercased ticker after the formatted value", () => {
    const result = counterValueFormatter({
      value: 21_000_000,
      locale: "en-US",
      shorten: true,
      ticker: "btc",
    });
    expect(result).toMatch(/^21M BTC$/);
  });

  it("does not append anything when ticker is empty or whitespace", () => {
    expect(counterValueFormatter({ value: 100, locale: "en-US", ticker: "" })).toBe("100");
    expect(counterValueFormatter({ value: 100, locale: "en-US", ticker: "   " })).toBe("100");
  });

  it("does not append a ticker for the falsy '-' branch", () => {
    expect(counterValueFormatter({ value: 0, locale: "en-US", ticker: "btc" })).toBe("-");
  });
});
