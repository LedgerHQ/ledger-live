import BigNumber from "bignumber.js";
import type { Quote } from "../types";
import { buildNetCounterValue } from "./buildNetCounterValue";

// Quotes come from JSON, so fields may hold anything at runtime
const fromApi = (payload: object): Quote => JSON.parse(JSON.stringify(payload));

const quote = {
  key: "lifi",
  provider: "lifi",
  quoteDetails: {
    type: "float",
    sendAmount: 1,
    receiveAmount: 2,
    networkFees: { currencyId: "ethereum" },
    estimatedNetworkFee: { amount: "1000", currencyId: "ethereum" },
  },
  warnings: [],
  errors: [],
};

const context = {
  receiveCurrencyId: "bitcoin",
  spotPrices: { bitcoin: 10, ethereum: 1 },
  feeCurrencyMagnitude: 3,
};

describe("buildNetCounterValue", () => {
  it("subtracts the fee countervalue from the receive countervalue", () => {
    expect(buildNetCounterValue(fromApi(quote), context)).toEqual(new BigNumber(19));
  });

  it.each([undefined, null, "", "abc"])("counts a receive amount of %p as zero", receiveAmount => {
    const result = buildNetCounterValue(
      fromApi({ ...quote, quoteDetails: { ...quote.quoteDetails, receiveAmount } }),
      context,
    );
    expect(result).toEqual(new BigNumber(-1));
  });

  it.each([null, "", "abc"])("counts a fee amount of %p as zero", amount => {
    const result = buildNetCounterValue(
      fromApi({
        ...quote,
        quoteDetails: {
          ...quote.quoteDetails,
          estimatedNetworkFee: { amount, currencyId: "ethereum" },
        },
      }),
      context,
    );
    expect(result).toEqual(new BigNumber(20));
  });
});
