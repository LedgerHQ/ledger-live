import { computeQuotesErrors } from "./computeQuotesErrors";
import type { RawQuoteError } from "./service/types";

function makeProviderError(overrides: Partial<RawQuoteError> = {}): RawQuoteError {
  return {
    code: "amount_off_limits",
    type: "float",
    provider: "lifi",
    message: "amount out of range",
    parameter: {},
    ...overrides,
  };
}

describe("computeQuotesErrors", () => {
  it("returns an empty list when at least one successful quote came back, regardless of providerErrors", () => {
    const result = computeQuotesErrors({
      successfulQuotesCount: 1,
      providerErrors: [
        makeProviderError({ parameter: { minAmount: "10" } }),
        makeProviderError({ parameter: { maxAmount: "1" } }),
      ],
      amountFrom: "5",
    });

    expect(result).toEqual([]);
  });

  it("emits only `noQuotes` when no successful quotes and no rejection rows", () => {
    const result = computeQuotesErrors({
      successfulQuotesCount: 0,
      providerErrors: [],
      amountFrom: "5",
    });

    expect(result).toEqual([{ code: "noQuotes" }]);
  });

  it("stacks `amountTooLow` on top of `noQuotes` when a min-bound row brackets amountFrom", () => {
    const result = computeQuotesErrors({
      successfulQuotesCount: 0,
      providerErrors: [makeProviderError({ parameter: { minAmount: "10" } })],
      amountFrom: "5",
    });

    expect(result).toEqual([
      { code: "noQuotes" },
      { code: "amountTooLow", minAmount: "10" },
    ]);
  });

  it("stacks `amountTooHigh` on top of `noQuotes` when a max-bound row brackets amountFrom", () => {
    const result = computeQuotesErrors({
      successfulQuotesCount: 0,
      providerErrors: [makeProviderError({ parameter: { maxAmount: "100" } })],
      amountFrom: "200",
    });

    expect(result).toEqual([
      { code: "noQuotes" },
      { code: "amountTooHigh", maxAmount: "100" },
    ]);
  });

  it("stacks all three when both bounds match", () => {
    const result = computeQuotesErrors({
      successfulQuotesCount: 0,
      providerErrors: [
        makeProviderError({ parameter: { minAmount: "10" } }),
        makeProviderError({ parameter: { maxAmount: "1" }, provider: "okx" }),
      ],
      amountFrom: "5",
    });

    expect(result).toEqual([
      { code: "noQuotes" },
      { code: "amountTooLow", minAmount: "10" },
      { code: "amountTooHigh", maxAmount: "1" },
    ]);
  });

  it("picks the lowest reported `minAmount` across providers", () => {
    const result = computeQuotesErrors({
      successfulQuotesCount: 0,
      providerErrors: [
        makeProviderError({ provider: "lifi", parameter: { minAmount: "20" } }),
        makeProviderError({ provider: "okx", parameter: { minAmount: "12" } }),
        makeProviderError({ provider: "uniswap", parameter: { minAmount: "30" } }),
      ],
      amountFrom: "5",
    });

    expect(result).toEqual([
      { code: "noQuotes" },
      { code: "amountTooLow", minAmount: "12" },
    ]);
  });

  it("picks the highest reported `maxAmount` across providers", () => {
    const result = computeQuotesErrors({
      successfulQuotesCount: 0,
      providerErrors: [
        makeProviderError({ provider: "lifi", parameter: { maxAmount: "100" } }),
        makeProviderError({ provider: "okx", parameter: { maxAmount: "150" } }),
        makeProviderError({ provider: "uniswap", parameter: { maxAmount: "50" } }),
      ],
      amountFrom: "200",
    });

    expect(result).toEqual([
      { code: "noQuotes" },
      { code: "amountTooHigh", maxAmount: "150" },
    ]);
  });

  it("ignores `amount_off_limits` rows whose threshold does not bracket amountFrom (legacy filter)", () => {
    const result = computeQuotesErrors({
      successfulQuotesCount: 0,
      providerErrors: [
        // user input 5 is ABOVE this provider's minimum -> not a `tooLow` candidate
        makeProviderError({ parameter: { minAmount: "1" } }),
        // user input 5 is BELOW this provider's maximum -> not a `tooHigh` candidate
        makeProviderError({ parameter: { maxAmount: "10" }, provider: "okx" }),
      ],
      amountFrom: "5",
    });

    expect(result).toEqual([{ code: "noQuotes" }]);
  });

  it("treats edge case `minAmount === amountFrom` as below the limit (legacy `gte`)", () => {
    // Legacy filter: BigNumber(minAmount).gte(amountFrom) — equality counts.
    const result = computeQuotesErrors({
      successfulQuotesCount: 0,
      providerErrors: [makeProviderError({ parameter: { minAmount: "5" } })],
      amountFrom: "5",
    });

    expect(result).toEqual([
      { code: "noQuotes" },
      { code: "amountTooLow", minAmount: "5" },
    ]);
  });

  it("ignores rejection rows with codes other than `amount_off_limits`", () => {
    const result = computeQuotesErrors({
      successfulQuotesCount: 0,
      providerErrors: [
        // legacy never inspects these; they remain in providerErrors for the
        // consumer to surface directly if it wants to.
        makeProviderError({ code: "unknown_error", parameter: { minAmount: "10" } }),
      ],
      amountFrom: "5",
    });

    expect(result).toEqual([{ code: "noQuotes" }]);
  });

  it("ignores `amount_off_limits` rows missing both bound parameters", () => {
    const result = computeQuotesErrors({
      successfulQuotesCount: 0,
      providerErrors: [makeProviderError({ parameter: {} })],
      amountFrom: "5",
    });

    expect(result).toEqual([{ code: "noQuotes" }]);
  });
});
