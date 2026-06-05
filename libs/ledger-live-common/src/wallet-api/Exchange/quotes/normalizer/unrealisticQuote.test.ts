import type { RawQuote } from "../service/types";
import { QuoteWarningCodes } from "../types";
import { computeUnrealisticQuote } from "./unrealisticQuote";

function makeRawQuote(overrides: Partial<RawQuote> = {}): RawQuote {
  return {
    provider: "lifi",
    providerType: "DEX",
    type: "float",
    amountFrom: 1,
    amountTo: 1,
    exchangeRate: 1,
    slippage: 0,
    networkFees: { currency: "ethereum" },
    tags: { isRegistrationRequired: false, isTokenApprovalRequired: false },
    key: "lifi-float-ethereum",
    liquiditySource: "AMM",
    ...overrides,
  };
}

const ethToBtcDoubledFiat = {
  sendCurrencyId: "ethereum",
  receiveCurrencyId: "bitcoin",
  spotPrices: { ethereum: 1, bitcoin: 2 },
};

describe("computeUnrealisticQuote", () => {
  it("returns null when the send-side spot price is missing", () => {
    expect(
      computeUnrealisticQuote(makeRawQuote(), {
        sendCurrencyId: "ethereum",
        receiveCurrencyId: "bitcoin",
        spotPrices: { bitcoin: 2 },
      }),
    ).toBeNull();
  });

  it("returns null when the receive-side spot price is missing", () => {
    expect(
      computeUnrealisticQuote(makeRawQuote(), {
        sendCurrencyId: "ethereum",
        receiveCurrencyId: "bitcoin",
        spotPrices: { ethereum: 1 },
      }),
    ).toBeNull();
  });

  it("returns null when `amountFrom` is zero (division guard)", () => {
    expect(
      computeUnrealisticQuote(makeRawQuote({ amountFrom: 0 }), ethToBtcDoubledFiat),
    ).toBeNull();
  });

  it("returns null when `amountFrom` is missing", () => {
    expect(
      computeUnrealisticQuote(makeRawQuote({ amountFrom: undefined }), ethToBtcDoubledFiat),
    ).toBeNull();
  });

  it("returns null when output fiat does not exceed input fiat", () => {
    // 10 * 1 = 10 input fiat, 5 * 2 = 10 output fiat → gain = 0%
    expect(
      computeUnrealisticQuote(makeRawQuote({ amountFrom: 10, amountTo: 5 }), ethToBtcDoubledFiat),
    ).toBeNull();
  });

  it("emits `unrealisticQuote` with the fiat gain percentage when output fiat exceeds input fiat", () => {
    // 1 * 1 = 1 input fiat, 1 * 2 = 2 output fiat → gain = 100%
    expect(
      computeUnrealisticQuote(makeRawQuote({ amountFrom: 1, amountTo: 1 }), ethToBtcDoubledFiat),
    ).toEqual({ code: QuoteWarningCodes.UNREALISTIC_QUOTE, gainPercent: 100 });
  });

  it("returns null when the gain percentage overflows to a non-finite number", () => {
    // Extreme spot-price ratio pushes gainPercent past Number.MAX_VALUE so
    // BigNumber.toNumber() yields Infinity. Returning null keeps the numeric
    // contract intact (Infinity would serialize to null over JSON).
    expect(
      computeUnrealisticQuote(makeRawQuote({ amountFrom: 1, amountTo: 1 }), {
        sendCurrencyId: "ethereum",
        receiveCurrencyId: "bitcoin",
        spotPrices: { ethereum: Number.MIN_VALUE, bitcoin: Number.MAX_VALUE },
      }),
    ).toBeNull();
  });
});
