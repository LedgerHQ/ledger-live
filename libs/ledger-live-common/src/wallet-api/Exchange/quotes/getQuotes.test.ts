import { getQuotes, type GetQuotesContext } from "./getQuotes";
import { fetchQuotes } from "./service/fetchQuotes";
import { fetchAndMergeProviderData } from "../../../exchange/providers/swap";
import type { RawQuote, RawQuoteError } from "./service/types";
import type { GetQuotesArgs } from "./types";

jest.mock("./service/fetchQuotes", () => ({
  fetchQuotes: jest.fn(),
}));

jest.mock("../../../exchange/providers/swap", () => ({
  fetchAndMergeProviderData: jest.fn(),
}));

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn().mockReturnValue(false),
}));

const fetchQuotesMock = jest.mocked(fetchQuotes);
const fetchAndMergeProviderDataMock = jest.mocked(fetchAndMergeProviderData);

function makeRawQuote(overrides: Partial<RawQuote> = {}): RawQuote {
  return {
    provider: "lifi",
    providerType: "DEX",
    amountFrom: 1,
    amountTo: 0.999,
    exchangeRate: 0.999,
    slippage: 1,
    type: "float",
    networkFees: { currency: "ethereum" },
    tags: { isRegistrationRequired: false, isTokenApprovalRequired: false },
    key: "lifi-key",
    liquiditySource: "AMM",
    ...overrides,
  };
}

function makeArgs(
  sendCurrencyId: string,
  receiveCurrencyId: string,
  overrides: Partial<GetQuotesArgs["data"]> = {},
): GetQuotesArgs {
  return {
    providers: ["lifi"],
    data: {
      amount: "1",
      sendAccountId: "send-account",
      receiveAccountId: "receive-account",
      sendAddress: "0xfrom",
      receiveAddress: "0xto",
      sendCurrencyId,
      receiveCurrencyId,
      counterValueCurrency: "usd",
      ...overrides,
    },
  };
}

const aggregatorError: RawQuoteError = {
  code: "QUOTE_ERROR",
  type: "float",
  provider: "lifi",
  message: "provider unavailable",
  parameter: {},
};

const emptyContext: GetQuotesContext = { accounts: [], spotPrices: {} };

describe("getQuotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchAndMergeProviderDataMock.mockResolvedValue({});
  });

  it("drops every successful quote for an unsupported pair while forwarding aggregator errors", async () => {
    fetchQuotesMock.mockResolvedValue({
      rawQuotes: [makeRawQuote()],
      errors: [aggregatorError],
    });

    const response = await getQuotes(makeArgs("near", "stellar"), emptyContext);

    expect(response.quotes).toEqual([]);
    expect(response.errors).toEqual([aggregatorError]);
  });

  it("blocks the unsupported pair in the reverse direction as well", async () => {
    fetchQuotesMock.mockResolvedValue({
      rawQuotes: [makeRawQuote({ provider: "thorswap" })],
      errors: [],
    });

    const response = await getQuotes(makeArgs("stellar", "near"), emptyContext);

    expect(response.quotes).toEqual([]);
    expect(response.errors).toEqual([]);
  });

  it("skips the provider-data fetch when the pair is unsupported", async () => {
    // The CAL + CDN round-trip inside `fetchAndMergeProviderData` is a cold
    // cache miss on first call; asserting the mock was not touched protects
    // the short-circuit path from regressions.
    fetchQuotesMock.mockResolvedValue({ rawQuotes: [makeRawQuote()], errors: [] });

    await getQuotes(makeArgs("near", "stellar"), emptyContext);

    expect(fetchAndMergeProviderDataMock).not.toHaveBeenCalled();
  });

  it("normalizes quotes for a supported pair and preserves aggregator errors", async () => {
    fetchQuotesMock.mockResolvedValue({
      rawQuotes: [makeRawQuote({ provider: "lifi" })],
      errors: [aggregatorError],
    });

    const response = await getQuotes(makeArgs("ethereum", "bitcoin"), emptyContext);

    expect(response.quotes).toHaveLength(1);
    expect(response.quotes[0].quoteDetails.exchangeRate).toBe(0.999);
    expect(response.errors).toEqual([aggregatorError]);
    expect(fetchAndMergeProviderDataMock).toHaveBeenCalledTimes(1);
  });
});
