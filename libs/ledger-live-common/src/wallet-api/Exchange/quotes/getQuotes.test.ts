import BigNumber from "bignumber.js";

import { getQuotes, type GetQuotesContext } from "./getQuotes";
import { fetchQuotes } from "./service/fetchQuotes";
import { fetchAndMergeProviderData } from "../../../exchange/providers/swap";
import { fetchNetworkFeeContext } from "./fetchNetworkFeeContext";
import { computeFeeEstimate } from "./normalizer/networkFeeEstimate";
import type { RawQuote, RawQuoteError } from "./service/types";
import type { GetQuotesArgs } from "./types";

jest.mock("./service/fetchQuotes", () => ({
  fetchQuotes: jest.fn(),
}));

jest.mock("../../../exchange/providers/swap", () => ({
  fetchAndMergeProviderData: jest.fn(),
}));

// Mocked to keep the bridge / live-network import chain out of this test
// suite — the wallet-side fee context is exercised end-to-end in
// fetchNetworkFeeContext.test.ts.
jest.mock("./fetchNetworkFeeContext", () => ({
  fetchNetworkFeeContext: jest.fn(),
}));

jest.mock("./normalizer/networkFeeEstimate", () => ({
  ...jest.requireActual("./normalizer/networkFeeEstimate"),
  computeFeeEstimate: jest.fn(),
}));

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn().mockReturnValue(""),
  changes: { subscribe: jest.fn() },
}));

const fetchQuotesMock = jest.mocked(fetchQuotes);
const fetchAndMergeProviderDataMock = jest.mocked(fetchAndMergeProviderData);
const fetchNetworkFeeContextMock = jest.mocked(fetchNetworkFeeContext);
const computeFeeEstimateMock = jest.mocked(computeFeeEstimate);

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

const emptyContext: GetQuotesContext = {
  accounts: [],
  spotPrices: {},
  locale: "en",
  counterValueCurrency: "usd",
};

describe("getQuotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchAndMergeProviderDataMock.mockResolvedValue({});
    fetchNetworkFeeContextMock.mockResolvedValue(null);
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

  it("forwards aggregator errors and skips the provider-data + fee-context fetches when no rawQuotes are returned", async () => {
    // Common error-only response: every provider rejected the request
    // (amount-too-small, KYC required, slippage too high, etc.). Both
    // fetchAndMergeProviderData (CAL + CDN) and fetchNetworkFeeContext
    // (bridge.sync + prepareTransaction + getTransactionStatus) are
    // pure waste in this case — their results would never be consumed
    // by normalizeQuote/computeFeeEstimate.
    fetchQuotesMock.mockResolvedValue({ rawQuotes: [], errors: [aggregatorError] });

    const response = await getQuotes(makeArgs("ethereum", "bitcoin"), emptyContext);

    expect(response).toEqual({ quotes: [], errors: [aggregatorError] });
    expect(fetchAndMergeProviderDataMock).not.toHaveBeenCalled();
    expect(fetchNetworkFeeContextMock).not.toHaveBeenCalled();
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

  describe("fee context plumbing", () => {
    const feeContext = {
      maxFeePerGas: new BigNumber("20000000000"),
      gasPrice: undefined,
      defaultGasLimit: "21000",
      estimatedFeesAtomic: new BigNumber("420000000000000"),
      balanceAtomic: new BigNumber("5000000000000000000"),
      feeCurrencyId: "ethereum",
      feeCurrencyMagnitude: 18,
      mainAccountCurrencyId: "ethereum",
    };

    it("forwards fromAccountId and amountFrom to fetchNetworkFeeContext", async () => {
      fetchQuotesMock.mockResolvedValue({ rawQuotes: [makeRawQuote()], errors: [] });

      await getQuotes(makeArgs("ethereum", "bitcoin", { amount: "1.5" }), {
        accounts: [],
        spotPrices: {},
        locale: "en",
        counterValueCurrency: "usd",
      });

      expect(fetchNetworkFeeContextMock).toHaveBeenCalledTimes(1);
      expect(fetchNetworkFeeContextMock).toHaveBeenCalledWith({
        accounts: [],
        fromAccountId: "send-account",
        amountFrom: "1.5",
      });
    });

    it("threads the fee estimate through normalizeQuote when context resolves", async () => {
      fetchNetworkFeeContextMock.mockResolvedValue(feeContext);
      computeFeeEstimateMock.mockReturnValue({
        estimatedNetworkFee: { amount: "420000000000000", currencyId: "ethereum" },
        approvalNetworkFee: undefined,
        notEnoughBalance: false,
      });
      fetchQuotesMock.mockResolvedValue({
        rawQuotes: [makeRawQuote({ provider: "lifi" })],
        errors: [],
      });

      const response = await getQuotes(makeArgs("ethereum", "bitcoin"), emptyContext);

      expect(computeFeeEstimateMock).toHaveBeenCalledTimes(1);
      expect(computeFeeEstimateMock).toHaveBeenCalledWith(expect.any(Object), feeContext);
      expect(response.quotes[0].quoteDetails.estimatedNetworkFee).toEqual({
        amount: "420000000000000",
        currencyId: "ethereum",
      });
    });

    it("emits notEnoughBalanceForFees when the fee estimate flags it", async () => {
      fetchNetworkFeeContextMock.mockResolvedValue(feeContext);
      computeFeeEstimateMock.mockReturnValue({
        estimatedNetworkFee: { amount: "1", currencyId: "ethereum" },
        approvalNetworkFee: undefined,
        notEnoughBalance: true,
      });
      fetchQuotesMock.mockResolvedValue({ rawQuotes: [makeRawQuote()], errors: [] });

      const response = await getQuotes(makeArgs("ethereum", "bitcoin"), emptyContext);

      expect(response.quotes[0].error).toBe("notEnoughBalanceForFees");
    });

    it("skips computeFeeEstimate and emits no fee fields when context is null", async () => {
      fetchNetworkFeeContextMock.mockResolvedValue(null);
      fetchQuotesMock.mockResolvedValue({ rawQuotes: [makeRawQuote()], errors: [] });

      const response = await getQuotes(makeArgs("ethereum", "bitcoin"), emptyContext);

      expect(computeFeeEstimateMock).not.toHaveBeenCalled();
      expect(response.quotes[0].quoteDetails.estimatedNetworkFee).toBeUndefined();
      expect(response.quotes[0].quoteDetails.approvalNetworkFee).toBeUndefined();
      expect(response.quotes[0].error).toBeNull();
    });

    it("does not drop `oneinchfusion` rows on Ethereum source (filter is hook-permanent)", async () => {
      // LIVE-29454 / commit b76fc9c4a (Apr 30 2026) added an Ethereum-only
      // exclusion of `oneinchfusion` quotes in the legacy `useGetQuotes`
      // hook. The phase 2 plan classifies the dedupe-pair as hook-permanent
      // (sort + dedupe travel together client-side); the wallet pipeline
      // intentionally does NOT replicate the rule. This smoke test pins
      // that decision so a future server-side migration does not silently
      // drop fusion rows. The hook-side filter remains outside this
      // wallet-side pipeline and covers the user-facing behavior.
      fetchQuotesMock.mockResolvedValue({
        rawQuotes: [
          makeRawQuote({ provider: "oneinch", key: "oneinch-key" }),
          makeRawQuote({ provider: "oneinchfusion", key: "oneinchfusion-key" }),
        ],
        errors: [],
      });

      const response = await getQuotes(makeArgs("ethereum", "bitcoin"), emptyContext);

      expect(response.quotes.map(q => q.provider)).toEqual(["oneinch", "oneinchfusion"]);
    });

    it("computes a fee estimate per quote (one call per row)", async () => {
      fetchNetworkFeeContextMock.mockResolvedValue(feeContext);
      computeFeeEstimateMock.mockReturnValue({
        estimatedNetworkFee: undefined,
        approvalNetworkFee: undefined,
        notEnoughBalance: false,
      });
      fetchQuotesMock.mockResolvedValue({
        rawQuotes: [
          makeRawQuote({ provider: "lifi", key: "lifi-key" }),
          makeRawQuote({ provider: "oneinch", key: "oneinch-key" }),
          makeRawQuote({ provider: "thorswap", key: "thorswap-key" }),
        ],
        errors: [],
      });

      await getQuotes(makeArgs("ethereum", "bitcoin"), emptyContext);

      expect(computeFeeEstimateMock).toHaveBeenCalledTimes(3);
    });
  });
});
