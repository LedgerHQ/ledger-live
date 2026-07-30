import { makeQuotesInput } from "../fixtures/quotesInput";
import { swapQuotesApi } from "../state-manager/api";
import { getSwapQuotesDispatch } from "../state-manager/store";
import { ProviderErrorCodes } from "../types";
import { fetchQuotes } from "./fetchQuotes";

jest.mock("../state-manager/store", () => ({
  getSwapQuotesDispatch: jest.fn(),
}));

jest.mock("../state-manager/api", () => ({
  swapQuotesApi: {
    endpoints: {
      fetchQuotes: {
        initiate: jest.fn(),
      },
    },
  },
}));

const getSwapQuotesDispatchMock = jest.mocked(getSwapQuotesDispatch);
const initiateMock = jest.mocked(swapQuotesApi.endpoints.fetchQuotes.initiate);

const DISPATCH_OPTIONS = { forceRefetch: true };

function makeArgs(): Parameters<typeof fetchQuotes>[0] {
  return {
    providers: ["lifi", "okx"],
    data: makeQuotesInput(),
  };
}

describe("fetchQuotes", () => {
  let unsubscribe: jest.Mock;

  /**
   * `fetchQuotes` awaits the dispatched query promise and unsubscribes it once
   * settled, so the mocked dispatch has to return a promise carrying
   * `unsubscribe`.
   */
  function mockResult(result: unknown) {
    getSwapQuotesDispatchMock.mockReturnValue(
      // A stub can't structurally satisfy ThunkDispatch's overloads.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      jest.fn(() => Object.assign(Promise.resolve(result), { unsubscribe })) as never,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    unsubscribe = jest.fn();
    // The thunk returned by `initiate` is opaque to `fetchQuotes`; only the
    // dispatched result matters, so return a marker we can assert against.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    initiateMock.mockImplementation(((arg: unknown) => ({ arg })) as never);
  });

  it("returns the quotes split by the endpoint", async () => {
    const rawQuotes = [{ provider: "lifi", key: "lifi-key" }];
    const providerErrors = [
      {
        code: ProviderErrorCodes.AMOUNT_OFF_LIMITS,
        provider: "okx",
        message: "amount out of range",
      },
    ];
    mockResult({ data: { rawQuotes, providerErrors } });

    const result = await fetchQuotes(makeArgs(), "usd");

    expect(result).toEqual({ rawQuotes, providerErrors });
    expect(initiateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        providers: ["lifi", "okx"],
        counterValueCurrency: "usd",
        quotesInput: expect.objectContaining({
          sendCurrencyId: "bitcoin",
          receiveCurrencyId: "ethereum",
        }),
      }),
      DISPATCH_OPTIONS,
    );
  });

  it("releases the cache subscription once the request settles", async () => {
    mockResult({ data: { rawQuotes: [], providerErrors: [] } });

    await fetchQuotes(makeArgs(), "usd");

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("releases the cache subscription even when the request fails", async () => {
    mockResult({ error: { status: "FETCH_ERROR", error: "network down" } });

    await expect(fetchQuotes(makeArgs(), "usd")).rejects.toBeDefined();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("returns an empty result when the endpoint yields no data", async () => {
    mockResult({});

    await expect(fetchQuotes(makeArgs(), "usd")).resolves.toEqual({
      rawQuotes: [],
      providerErrors: [],
    });
  });

  it.each([
    ["a numeric HTTP status", { status: 502, data: "<html>502</html>" }],
    [
      "a parsing error carrying the original status",
      { status: "PARSING_ERROR", originalStatus: 500 },
    ],
  ])("returns an empty result on %s", async (_label, error) => {
    mockResult({ error });

    await expect(fetchQuotes(makeArgs(), "usd")).resolves.toEqual({
      rawQuotes: [],
      providerErrors: [],
    });
  });

  it.each([
    ["FETCH_ERROR", { status: "FETCH_ERROR", error: "network down" }],
    ["TIMEOUT_ERROR", { status: "TIMEOUT_ERROR", error: "timed out" }],
  ])("throws a named Error for %s, which never reached the aggregator", async (_label, error) => {
    mockResult({ error });

    await expect(fetchQuotes(makeArgs(), "usd")).rejects.toMatchObject({
      name: "SwapQuotesRequestFailed",
      cause: error,
    });
    await expect(fetchQuotes(makeArgs(), "usd")).rejects.toBeInstanceOf(Error);
  });

  it("folds the transport detail into the message", async () => {
    mockResult({ error: { status: "FETCH_ERROR", error: "network down" } });

    // `cause` is non-enumerable and does not survive `serializeError`, so the
    // message is what actually reaches the live app and monitoring.
    await expect(fetchQuotes(makeArgs(), "usd")).rejects.toThrow(
      "swap /quote request failed: FETCH_ERROR: network down",
    );
  });

  it("flattens caller-supplied headers before dispatching", async () => {
    mockResult({ data: { rawQuotes: [], providerErrors: [] } });
    const args: Parameters<typeof fetchQuotes>[0] = {
      ...makeArgs(),
      headers: [["x-foo", "bar"]],
    };

    await fetchQuotes(args, "usd");

    expect(initiateMock).toHaveBeenCalledWith(
      expect.objectContaining({ customHeaders: { "x-foo": "bar" } }),
      DISPATCH_OPTIONS,
    );
  });
});
