import { ProviderErrorCodes } from "../types";
import { swapQuotesApi, type FetchQuotesDispatch } from "../state-manager/api";
import { fetchAuthenticatedQuotes } from "./fetchAuthenticatedQuotes";
import type { RawQuote, RawQuoteAPIResponse, RawQuoteError } from "./types";

jest.mock(
  "@ledgerhq/rtk-query-auth",
  () => ({
    createAuthenticatedBaseQuery: jest.fn(() => jest.fn()),
  }),
  { virtual: true },
);

function makeArgs(): Parameters<typeof fetchAuthenticatedQuotes>[0] {
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
      networkFeesCurrencyId: "ethereum",
      slippage: 0.5,
    },
    headers: [["x-custom-header", "custom-value"]],
  };
}

const rawQuote: RawQuote = {
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

const providerError: RawQuoteError = {
  code: ProviderErrorCodes.AMOUNT_OFF_LIMITS,
  type: "float",
  provider: "okx",
  message: "amount out of range",
  parameter: { minAmount: "200000000" },
};

function makeQueryResult({
  data,
  error,
}: {
  data?: RawQuoteAPIResponse;
  error?: unknown;
}): ReturnType<FetchQuotesDispatch> {
  return {
    abort: jest.fn(),
    unsubscribe: jest.fn(),
    unwrap: jest.fn(() => (error ? Promise.reject(error) : Promise.resolve(data ?? []))),
  };
}

function makeDispatch(
  queryResult: ReturnType<FetchQuotesDispatch>,
): jest.MockedFunction<FetchQuotesDispatch> {
  return jest.fn<ReturnType<FetchQuotesDispatch>, Parameters<FetchQuotesDispatch>>(
    () => queryResult,
  );
}

describe("fetchAuthenticatedQuotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("splits successful quote rows from provider error rows", async () => {
    const initiateSpy = jest.spyOn(swapQuotesApi.endpoints.getSwapQuotes, "initiate");
    const queryResult = makeQueryResult({ data: [rawQuote, providerError] });
    const dispatch = makeDispatch(queryResult);

    const result = await fetchAuthenticatedQuotes(makeArgs(), "usd", dispatch);

    expect(result).toEqual({
      rawQuotes: [rawQuote],
      providerErrors: [providerError],
    });
    expect(initiateSpy).toHaveBeenCalledWith(
      {
        headers: {
          Accept: "application/json",
          "x-custom-header": "custom-value",
        },
        params: expect.any(URLSearchParams),
      },
      { forceRefetch: true, subscribe: false },
    );
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(queryResult.unsubscribe).toHaveBeenCalledTimes(1);

    const request = initiateSpy.mock.calls[0][0];
    expect(request.params.get("from")).toBe("bitcoin");
    expect(request.params.get("to")).toBe("ethereum");
    expect(request.params.get("providers-whitelist")).toBe("lifi,okx");
    expect(request.params.get("fiatForCounterValue")).toBe("usd");
    expect(request.params.get("currencyTicker")).toBe("usd");
    expect(request.params.get("networkFeesCurrency")).toBe("ethereum");
    expect(request.params.get("slippage")).toBe("0.5");
  });

  it("returns an empty result when the authenticated query response is not OK", async () => {
    const queryResult = makeQueryResult({ error: { status: 500 } });
    const dispatch = makeDispatch(queryResult);

    await expect(fetchAuthenticatedQuotes(makeArgs(), "usd", dispatch)).resolves.toEqual({
      rawQuotes: [],
      providerErrors: [],
    });
    expect(queryResult.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("rethrows aborted requests", async () => {
    const controller = new AbortController();
    controller.abort();
    const abortError = { name: "AbortError", message: "cancelled" };
    const queryResult = makeQueryResult({ error: abortError });
    const dispatch = makeDispatch(queryResult);

    await expect(
      fetchAuthenticatedQuotes({ ...makeArgs(), signal: controller.signal }, "usd", dispatch),
    ).rejects.toBe(abortError);
    expect(queryResult.abort).toHaveBeenCalledTimes(1);
    expect(queryResult.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("rethrows network failures without an HTTP status", async () => {
    const networkError = { status: "FETCH_ERROR", error: "network failure" };
    const queryResult = makeQueryResult({ error: networkError });
    const dispatch = makeDispatch(queryResult);

    await expect(fetchAuthenticatedQuotes(makeArgs(), "usd", dispatch)).rejects.toBe(networkError);
    expect(queryResult.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
