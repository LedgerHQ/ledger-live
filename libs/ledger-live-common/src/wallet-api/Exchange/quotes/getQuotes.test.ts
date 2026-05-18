import BigNumber from "bignumber.js";

import { getQuotes, type GetQuotesContext } from "./getQuotes";
import { fetchQuotes } from "./service/fetchQuotes";
import { fetchAndMergeProviderData } from "../../../exchange/providers/swap";
import { fetchNetworkFeeContext } from "./fetchNetworkFeeContext";
import { computeFeeEstimate } from "./normalizer/networkFeeEstimate";
import type { RawQuote, RawQuoteError } from "./service/types";
import { ProviderErrorCodes, QuoteErrorCodes, QuotesErrorCodes, type GetQuotesArgs } from "./types";

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

// `live-network` reads `getEnv("LEDGER_CLIENT_VERSION")?.startsWith(...)` and
// `changes.subscribe(...)` at module load (transitive import via
// buildFormatContext -> currencies -> live-countervalues -> live-network). We
// need to satisfy both at module-eval time, so the mock surfaces a no-op
// `changes` subject alongside `getEnv`. Per-test `getEnv` overrides happen via
// the `jest.mocked` hook in the suite body.
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

  it("drops every successful quote for an unsupported pair while forwarding providerErrors", async () => {
    fetchQuotesMock.mockResolvedValue({
      rawQuotes: [makeRawQuote()],
      providerErrors: [aggregatorError],
    });

    const response = await getQuotes(makeArgs("near", "stellar"), emptyContext);

    expect(response.quotes).toEqual([]);
    expect(response.providerErrors).toEqual([aggregatorError]);
    // Unsupported pair drops every successful quote -> the digested
    // error list is non-empty (`noQuotes` from the producer).
    expect(response.errors).toEqual([{ code: QuotesErrorCodes.NO_QUOTES }]);
  });

  it("blocks the unsupported pair in the reverse direction as well", async () => {
    fetchQuotesMock.mockResolvedValue({
      rawQuotes: [makeRawQuote({ provider: "thorswap" })],
      providerErrors: [],
    });

    const response = await getQuotes(makeArgs("stellar", "near"), emptyContext);

    expect(response.quotes).toEqual([]);
    expect(response.providerErrors).toEqual([]);
    expect(response.errors).toEqual([{ code: QuotesErrorCodes.NO_QUOTES }]);
  });

  it("skips the provider-data fetch when the pair is unsupported", async () => {
    // The CAL + CDN round-trip inside `fetchAndMergeProviderData` is a cold
    // cache miss on first call; asserting the mock was not touched protects
    // the short-circuit path from regressions.
    fetchQuotesMock.mockResolvedValue({ rawQuotes: [makeRawQuote()], providerErrors: [] });

    await getQuotes(makeArgs("near", "stellar"), emptyContext);

    expect(fetchAndMergeProviderDataMock).not.toHaveBeenCalled();
  });

  it("forwards providerErrors and skips the provider-data + fee-context fetches when no rawQuotes are returned", async () => {
    // Common error-only response: every provider rejected the request
    // (amount-too-small, KYC required, slippage too high, etc.). Both
    // fetchAndMergeProviderData (CAL + CDN) and fetchNetworkFeeContext
    // (bridge.sync + prepareTransaction + getTransactionStatus) are
    // pure waste in this case — their results would never be consumed
    // by normalizeQuote/computeFeeEstimate.
    fetchQuotesMock.mockResolvedValue({ rawQuotes: [], providerErrors: [aggregatorError] });

    const response = await getQuotes(makeArgs("ethereum", "bitcoin"), emptyContext);

    expect(response.quotes).toEqual([]);
    expect(response.providerErrors).toEqual([aggregatorError]);
    expect(response.errors).toEqual([{ code: QuotesErrorCodes.NO_QUOTES }]);
    expect(fetchAndMergeProviderDataMock).not.toHaveBeenCalled();
    expect(fetchNetworkFeeContextMock).not.toHaveBeenCalled();
  });

  it("normalizes quotes for a supported pair and preserves providerErrors with an empty digested errors list", async () => {
    fetchQuotesMock.mockResolvedValue({
      rawQuotes: [makeRawQuote({ provider: "lifi" })],
      providerErrors: [aggregatorError],
    });

    const response = await getQuotes(makeArgs("ethereum", "bitcoin"), emptyContext);

    expect(response.quotes).toHaveLength(1);
    expect(response.quotes[0].quoteDetails.exchangeRate).toBe(0.999);
    expect(response.providerErrors).toEqual([aggregatorError]);
    // Successful quotes were returned -> the producer emits no globals,
    // even when the response carries provider-level rejection rows.
    expect(response.errors).toEqual([]);
    expect(fetchAndMergeProviderDataMock).toHaveBeenCalledTimes(1);
  });

  it("returns plain Quote objects sorted by netCounterValue", async () => {
    const feeContext = {
      maxFeePerGas: undefined,
      gasPrice: undefined,
      defaultGasLimit: "21000",
      estimatedFeesAtomic: new BigNumber(0),
      balanceAtomic: new BigNumber("5000000000000000000"),
      feeCurrencyId: "ethereum",
      feeCurrencyMagnitude: 18,
      mainAccountCurrencyId: "ethereum",
    };
    fetchNetworkFeeContextMock.mockResolvedValue(feeContext);
    computeFeeEstimateMock.mockImplementation(raw => {
      if (raw.key === "higher-receive-with-fees") {
        return {
          estimatedNetworkFee: { amount: "100000000000000000", currencyId: "ethereum" },
          approvalNetworkFee: { amount: "100000000000000000", currencyId: "ethereum" },
          notEnoughBalance: false,
        };
      }
      return {
        estimatedNetworkFee: undefined,
        approvalNetworkFee: undefined,
        notEnoughBalance: false,
      };
    });
    fetchQuotesMock.mockResolvedValue({
      rawQuotes: [
        makeRawQuote({
          key: "higher-receive-with-fees",
          amountTo: 1,
          networkFees: { currency: "ethereum" },
        }),
        makeRawQuote({
          key: "lower-receive-no-fees",
          amountTo: 0.99,
          networkFees: { currency: "ethereum" },
        }),
      ],
      providerErrors: [],
    });

    const response = await getQuotes(makeArgs("ethereum", "bitcoin"), {
      ...emptyContext,
      spotPrices: { bitcoin: 30_000, ethereum: 2_000 },
    });

    expect(response.quotes.map(q => q.key)).toEqual([
      "lower-receive-no-fees",
      "higher-receive-with-fees",
    ]);
    expect(response.quotes[0]).not.toHaveProperty("netCounterValue");
    expect(response.quotes[0]).not.toHaveProperty("quote");
  });

  describe("digested global errors (computeQuotesErrors integration)", () => {
    it("emits `amountTooLow` alongside `noQuotes` when every provider rejected on a min bound that brackets the input", async () => {
      // amount = "1", min bounds reported = "10" and "12" -> lowest is "10".
      fetchQuotesMock.mockResolvedValue({
        rawQuotes: [],
        providerErrors: [
          {
            code: ProviderErrorCodes.AMOUNT_OFF_LIMITS,
            type: "float",
            provider: "lifi",
            message: "min",
            parameter: { minAmount: "10" },
          },
          {
            code: ProviderErrorCodes.AMOUNT_OFF_LIMITS,
            type: "float",
            provider: "okx",
            message: "min",
            parameter: { minAmount: "12" },
          },
        ],
      });

      const response = await getQuotes(
        makeArgs("ethereum", "bitcoin", { amount: "1" }),
        emptyContext,
      );

      expect(response.errors).toEqual([
        { code: QuotesErrorCodes.NO_QUOTES },
        { code: QuotesErrorCodes.AMOUNT_TOO_LOW, minAmount: "10" },
      ]);
    });

    it("emits `amountTooHigh` alongside `noQuotes` when every provider rejected on a max bound that brackets the input", async () => {
      fetchQuotesMock.mockResolvedValue({
        rawQuotes: [],
        providerErrors: [
          {
            code: ProviderErrorCodes.AMOUNT_OFF_LIMITS,
            type: "float",
            provider: "lifi",
            message: "max",
            parameter: { maxAmount: "100" },
          },
          {
            code: ProviderErrorCodes.AMOUNT_OFF_LIMITS,
            type: "float",
            provider: "okx",
            message: "max",
            parameter: { maxAmount: "150" },
          },
        ],
      });

      const response = await getQuotes(
        makeArgs("ethereum", "bitcoin", { amount: "200" }),
        emptyContext,
      );

      expect(response.errors).toEqual([
        { code: QuotesErrorCodes.NO_QUOTES },
        { code: QuotesErrorCodes.AMOUNT_TOO_HIGH, maxAmount: "150" },
      ]);
    });

    it("does not emit any digested errors when at least one quote was successful, even when providerErrors contains amount_off_limits rows", async () => {
      fetchQuotesMock.mockResolvedValue({
        rawQuotes: [makeRawQuote()],
        providerErrors: [
          {
            code: ProviderErrorCodes.AMOUNT_OFF_LIMITS,
            type: "float",
            provider: "okx",
            message: "min",
            parameter: { minAmount: "10" },
          },
        ],
      });

      const response = await getQuotes(
        makeArgs("ethereum", "bitcoin", { amount: "1" }),
        emptyContext,
      );

      expect(response.errors).toEqual([]);
    });

    it("derives global errors for an unsupported pair from the forwarded providerErrors", async () => {
      fetchQuotesMock.mockResolvedValue({
        rawQuotes: [makeRawQuote()],
        providerErrors: [
          {
            code: ProviderErrorCodes.AMOUNT_OFF_LIMITS,
            type: "float",
            provider: "lifi",
            message: "min",
            parameter: { minAmount: "10" },
          },
        ],
      });

      const response = await getQuotes(makeArgs("near", "stellar", { amount: "1" }), emptyContext);

      // Unsupported-pair short-circuit forces successful quotes to 0. The
      // providerErrors still flow through, so amount_off_limits can stack too.
      expect(response.errors).toEqual([
        { code: QuotesErrorCodes.NO_QUOTES },
        { code: QuotesErrorCodes.AMOUNT_TOO_LOW, minAmount: "10" },
      ]);
    });
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
      fetchQuotesMock.mockResolvedValue({ rawQuotes: [makeRawQuote()], providerErrors: [] });

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
        providerErrors: [],
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
      fetchQuotesMock.mockResolvedValue({ rawQuotes: [makeRawQuote()], providerErrors: [] });

      const response = await getQuotes(makeArgs("ethereum", "bitcoin"), emptyContext);

      expect(response.quotes[0].errors).toEqual([
        { code: QuoteErrorCodes.NOT_ENOUGH_BALANCE_FOR_FEES },
      ]);
    });

    it("skips computeFeeEstimate and emits no fee fields when context is null", async () => {
      fetchNetworkFeeContextMock.mockResolvedValue(null);
      fetchQuotesMock.mockResolvedValue({ rawQuotes: [makeRawQuote()], providerErrors: [] });

      const response = await getQuotes(makeArgs("ethereum", "bitcoin"), emptyContext);

      expect(computeFeeEstimateMock).not.toHaveBeenCalled();
      expect(response.quotes[0].quoteDetails.estimatedNetworkFee).toBeUndefined();
      expect(response.quotes[0].quoteDetails.approvalNetworkFee).toBeUndefined();
      expect(response.quotes[0].errors).toEqual([]);
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
        providerErrors: [],
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
        providerErrors: [],
      });

      await getQuotes(makeArgs("ethereum", "bitcoin"), emptyContext);

      expect(computeFeeEstimateMock).toHaveBeenCalledTimes(3);
    });
  });
});
