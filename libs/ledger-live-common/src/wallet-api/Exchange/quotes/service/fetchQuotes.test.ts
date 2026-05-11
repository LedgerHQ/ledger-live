import axios from "axios";

import { getSwapAPIBaseURL } from "../../../../exchange/swap";
import { ProviderErrorCodes, type GetQuotesArgs } from "../types";
import { fetchQuotes } from "./fetchQuotes";

jest.mock("axios");

jest.mock("../../../../exchange/swap", () => ({
  getSwapAPIBaseURL: jest.fn(),
}));

const axiosGetMock = jest.mocked(axios.get);
const axiosIsAxiosErrorMock = jest.mocked(axios.isAxiosError);
const axiosIsCancelMock = jest.mocked(axios.isCancel);
const getSwapAPIBaseURLMock = jest.mocked(getSwapAPIBaseURL);

function makeArgs(): GetQuotesArgs {
  return {
    providers: ["lifi", "okx"],
    data: {
      amount: "100000000",
      sendAccountId: "send-account",
      receiveAccountId: "receive-account",
      sendAddress: "0xfrom",
      receiveAddress: "0xto",
      sendCurrencyId: "bitcoin",
      receiveCurrencyId: "ethereum",
    },
  };
}

describe("fetchQuotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSwapAPIBaseURLMock.mockReturnValue("https://swap.test");
    axiosIsAxiosErrorMock.mockReturnValue(false);
    axiosIsCancelMock.mockReturnValue(false);
  });

  it("splits successful quote rows from provider error rows", async () => {
    const rawQuote = {
      provider: "lifi",
      providerType: "DEX",
      amountFrom: 1,
      amountTo: 0.99,
      exchangeRate: 0.99,
      slippage: 1,
      type: "float",
      networkFees: { currency: "ethereum" },
      tags: { isRegistrationRequired: false, isTokenApprovalRequired: false },
      key: "lifi-key",
      liquiditySource: "AMM",
    };
    const providerError = {
      code: ProviderErrorCodes.AMOUNT_OFF_LIMITS,
      type: "float",
      provider: "okx",
      message: "amount out of range",
      parameter: { minAmount: "200000000" },
    };
    axiosGetMock.mockResolvedValue({ data: [rawQuote, providerError] });

    const result = await fetchQuotes(makeArgs(), "usd");

    expect(result).toEqual({
      rawQuotes: [rawQuote],
      providerErrors: [providerError],
    });
    expect(axiosGetMock).toHaveBeenCalledWith(
      expect.stringContaining("https://swap.test/quote?"),
      expect.objectContaining({ headers: expect.objectContaining({ Accept: "application/json" }) }),
    );
  });

  it("returns an empty result when the quote HTTP response is not OK", async () => {
    const httpError = { response: { status: 500 } };
    axiosGetMock.mockRejectedValue(httpError);
    axiosIsAxiosErrorMock.mockImplementation(error => error === httpError);

    await expect(fetchQuotes(makeArgs(), "usd")).resolves.toEqual({
      rawQuotes: [],
      providerErrors: [],
    });
  });

  it("rethrows cancelled requests", async () => {
    const cancelError = { message: "cancelled" };
    axiosGetMock.mockRejectedValue(cancelError);
    axiosIsCancelMock.mockImplementation(error => error === cancelError);

    await expect(fetchQuotes(makeArgs(), "usd")).rejects.toBe(cancelError);
  });

  it("rethrows network failures without an HTTP response", async () => {
    const networkError = { request: {} };
    axiosGetMock.mockRejectedValue(networkError);
    axiosIsAxiosErrorMock.mockImplementation(error => error === networkError);

    await expect(fetchQuotes(makeArgs(), "usd")).rejects.toBe(networkError);
  });
});
