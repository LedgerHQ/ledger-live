import { SwapQuotesRequestFailed } from "../../../../errors";
import { makeQuotesInput, makeRawQuote, makeRawQuoteError } from "@domain/api-swap-quotes/fixtures";
import { log } from "@ledgerhq/logs";
import { swapQuotesApi } from "../state-manager/api";
import { fetchQuotes } from "./fetchQuotes";

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

jest.mock("../state-manager/api", () => ({
  swapQuotesApi: {
    endpoints: {
      fetchQuotes: {
        initiate: jest.fn(),
      },
    },
  },
}));

const initiateMock = jest.mocked(swapQuotesApi.endpoints.fetchQuotes.initiate);
const logMock = jest.mocked(log);

const DISPATCH_OPTIONS = { forceRefetch: true };

function makeArgs(): Parameters<typeof fetchQuotes>[0] {
  return {
    providers: ["lifi", "okx"],
    data: makeQuotesInput(),
  };
}

describe("fetchQuotes", () => {
  let unsubscribe: jest.Mock;
  let dispatch: jest.Mock;

  // `fetchQuotes` unsubscribes the query promise once settled, so the stub has
  // to carry `unsubscribe`.
  function mockResult(result: unknown) {
    dispatch = jest.fn(() => Object.assign(Promise.resolve(result), { unsubscribe }));
  }

  beforeEach(() => {
    jest.clearAllMocks();
    unsubscribe = jest.fn();
    dispatch = jest.fn();
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    initiateMock.mockImplementation(((arg: unknown) => ({ arg })) as never);
  });

  it("returns the quotes split by the endpoint", async () => {
    const rawQuotes = [makeRawQuote()];
    const providerErrors = [makeRawQuoteError()];
    mockResult({ data: { rawQuotes, providerErrors } });

    const result = await fetchQuotes(makeArgs(), "usd", dispatch as never);

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

    await fetchQuotes(makeArgs(), "usd", dispatch as never);

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("releases the cache subscription even when the request fails", async () => {
    mockResult({ error: { status: "FETCH_ERROR", error: "network down" } });

    await expect(fetchQuotes(makeArgs(), "usd", dispatch as never)).rejects.toBeDefined();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("returns an empty result when the endpoint yields no data", async () => {
    mockResult({});

    await expect(fetchQuotes(makeArgs(), "usd", dispatch as never)).resolves.toEqual({
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

    await expect(fetchQuotes(makeArgs(), "usd", dispatch as never)).resolves.toEqual({
      rawQuotes: [],
      providerErrors: [],
    });
  });

  it.each([
    ["a numeric HTTP status", { status: 502, data: "<html>502</html>" }, "502 GET /quote"],
    [
      "a parsing error carrying the original status",
      { status: "PARSING_ERROR", originalStatus: 500 },
      "500 GET /quote",
    ],
  ])(
    // The caller turns this into "no quotes", which looks identical to a genuinely
    // empty result, so the log is the only trace that the aggregator failed.
    "logs a network-error on %s",
    async (_label, error, expected) => {
      mockResult({ error });

      await fetchQuotes(makeArgs(), "usd", dispatch as never);

      expect(logMock).toHaveBeenCalledWith("network-error", expect.stringContaining(expected));
    },
  );

  it("does not log a network-error when the request succeeds", async () => {
    mockResult({ data: { rawQuotes: [makeRawQuote()], providerErrors: [] } });

    await fetchQuotes(makeArgs(), "usd", dispatch as never);

    expect(logMock).not.toHaveBeenCalled();
  });

  it.each([
    ["FETCH_ERROR", { status: "FETCH_ERROR", error: "network down" }, "FETCH_ERROR: network down"],
    ["TIMEOUT_ERROR", { status: "TIMEOUT_ERROR", error: "timed out" }, "TIMEOUT_ERROR: timed out"],
    ["CUSTOM_ERROR without detail", { status: "CUSTOM_ERROR" }, "CUSTOM_ERROR"],
    ["a SerializedError", { name: "TypeError", message: "boom" }, "boom"],
    ["an unrecognisable error", {}, "unknown error"],
  ])(
    "throws a named Error whose message carries the detail of %s",
    async (_label, error, expectedDetail) => {
      mockResult({ error });

      await expect(fetchQuotes(makeArgs(), "usd", dispatch as never)).rejects.toThrow(
        `swap /quote request failed: ${expectedDetail}`,
      );
    },
  );

  it("attaches the raw RTK Query error as the cause", async () => {
    const error = { status: "FETCH_ERROR", error: "network down" };
    mockResult({ error });

    await expect(fetchQuotes(makeArgs(), "usd", dispatch as never)).rejects.toThrow(
      SwapQuotesRequestFailed,
    );
    await expect(fetchQuotes(makeArgs(), "usd", dispatch as never)).rejects.toMatchObject({
      cause: error,
    });
  });

  it("flattens caller-supplied headers before dispatching", async () => {
    mockResult({ data: { rawQuotes: [], providerErrors: [] } });
    const args: Parameters<typeof fetchQuotes>[0] = {
      ...makeArgs(),
      headers: [["x-foo", "bar"]],
    };

    await fetchQuotes(args, "usd", dispatch as never);

    expect(initiateMock).toHaveBeenCalledWith(
      expect.objectContaining({ customHeaders: { "x-foo": "bar" } }),
      DISPATCH_OPTIONS,
    );
  });
});
