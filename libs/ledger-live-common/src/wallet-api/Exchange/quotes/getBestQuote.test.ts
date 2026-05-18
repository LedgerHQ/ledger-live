import { getBestQuote } from "./getBestQuote";
import { getQuotes, type GetQuotesContext } from "./getQuotes";
import {
  ProviderErrorCodes,
  QuotesErrorCodes,
  type GetBestQuoteArgs,
  type GetQuotesResponse,
  type Quote,
} from "./types";

jest.mock("./getQuotes", () => ({
  getQuotes: jest.fn(),
}));

const getQuotesMock = jest.mocked(getQuotes);

function makeQuote(key: string): Quote {
  return {
    key,
    provider: "lifi",
    providerDetails: {
      name: "LiFi",
      type: "DEX",
      isUniswapX: false,
      requiresKYC: false,
      continuesInProviderLiveApp: false,
    },
    quoteDetails: {
      type: "float",
      sendAmount: 1,
      receiveAmount: 1,
      gasLess: false,
      networkFees: { currencyId: "ethereum" },
      slippage: 1,
      exchangeRate: 1,
    },
    warnings: [],
    errors: [],
  };
}

const args: GetBestQuoteArgs = {
  providers: ["lifi"],
  data: {
    amount: "1",
    sendAccountId: "send-account",
    receiveAccountId: "receive-account",
    sendAddress: "0xfrom",
    receiveAddress: "0xto",
    sendCurrencyId: "ethereum",
    receiveCurrencyId: "bitcoin",
  },
  sortBy: "netCounterValue",
};

const context: GetQuotesContext = {
  accounts: [],
  spotPrices: { bitcoin: 30_000, ethereum: 2_000 },
  locale: "en",
  counterValueCurrency: "usd",
};

describe("getBestQuote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the first quote from the sorted getQuotes response", async () => {
    const bestQuote = makeQuote("best");
    const response: GetQuotesResponse = {
      quotes: [bestQuote, makeQuote("second")],
      providerErrors: [],
      errors: [],
    };
    getQuotesMock.mockResolvedValue(response);

    await expect(getBestQuote(args, context)).resolves.toBe(bestQuote);
    expect(getQuotesMock).toHaveBeenCalledWith(args, context);
  });

  it("returns quote diagnostics when getQuotes has no quotes", async () => {
    const response: GetQuotesResponse = {
      quotes: [],
      providerErrors: [
        {
          code: ProviderErrorCodes.AMOUNT_OFF_LIMITS,
          type: "float",
          provider: "lifi",
          message: "min",
          parameter: { minAmount: "10" },
        },
      ],
      errors: [
        { code: QuotesErrorCodes.NO_QUOTES },
        { code: QuotesErrorCodes.AMOUNT_TOO_LOW, minAmount: "10" },
      ],
    };
    getQuotesMock.mockResolvedValue(response);

    await expect(getBestQuote(args, context)).resolves.toEqual({
      providerErrors: response.providerErrors,
      errors: response.errors,
    });
  });
});
