import { makeRawQuote, makeRawQuoteError } from "./fixtures/rawQuotes";
import { RawQuoteErrorSchema, RawQuoteSchema } from "./schema";
import { transformFetchQuotesResponse } from "./api";

describe("RawQuoteSchema", () => {
  it("accepts the fixture", () => {
    expect(RawQuoteSchema.safeParse(makeRawQuote()).success).toBe(true);
  });

  it("rejects a row whose required field has the wrong type", () => {
    expect(RawQuoteSchema.safeParse({ ...makeRawQuote(), slippage: "1" }).success).toBe(false);
  });

  it("accepts a row without liquiditySource, which the aggregator omits for some providers", () => {
    const { liquiditySource: _omitted, ...withoutSource } = makeRawQuote();

    expect(RawQuoteSchema.safeParse(withoutSource).success).toBe(true);
  });
});

describe("RawQuoteErrorSchema", () => {
  it("accepts the fixture", () => {
    expect(RawQuoteErrorSchema.safeParse(makeRawQuoteError()).success).toBe(true);
  });

  it("accepts a provider code it does not know about", () => {
    expect(RawQuoteErrorSchema.safeParse(makeRawQuoteError({ code: "brand_new" })).success).toBe(
      true,
    );
  });
});

describe("transformFetchQuotesResponse validation", () => {
  it("keeps provider-specific extra fields", () => {
    const withExtra = { ...makeRawQuote(), providerSpecificField: { nested: true } };

    const { rawQuotes } = transformFetchQuotesResponse([withExtra]);

    expect(rawQuotes[0]).toEqual(withExtra);
  });

  it("returns a row that fails the schema rather than discarding it", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const drifted = { ...makeRawQuote(), slippage: "1" };

    const { rawQuotes } = transformFetchQuotesResponse([drifted]);

    expect(rawQuotes).toEqual([drifted]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("RawQuoteSchema nested shapes", () => {
  // The aggregator only sends these for some providers, so the fixture omits
  // them; parsing a fully-populated row is what exercises the nested schemas.
  const permit2Single = {
    details: { token: "0xtok", amount: "1", expiration: "2", nonce: "3" },
    spender: "0xspender",
    sigDeadline: "9",
  };
  const permitData = {
    values: permit2Single,
    message: permit2Single,
    domain: { name: "Permit2", chainId: 1, verifyingContract: "0xverify" },
    types: {
      EIP712Domain: [{ name: "name", type: "string" }],
      PermitSingle: [{ name: "details", type: "PermitDetails" }],
      PermitDetails: [{ name: "token", type: "address" }],
    },
    primaryType: "PermitSingle" as const,
  };

  it("accepts a row populating every optional nested shape", () => {
    const full = makeRawQuote({
      slippageInfo: { default: 1, minSlippage: 0.1, maxSlippage: 5 },
      payoutNetworkFees: { value: 3, currency: "ethereum" },
      providerURL: "https://provider.test",
      quoteId: "q-1",
      currencyTicker: "USD",
      errors: [{ some: "error" }],
      tokenAllowanceData: {
        isApproved: false,
        approvedAmount: "0",
        approvalTransaction: {
          calldata: "0xdata",
          from: "0xfrom",
          gasLimit: 21000,
          gasPrice: 1,
          to: "0xto",
          value: "0",
        },
      },
      customFields: {
        permitData,
        "@type": "uniswap",
        quote: { nested: true },
        priceRoute: [1, 2],
        quoteId: 7,
        quoteResponse: { typedData: permitData, orderHash: "0xhash" },
      },
    });

    expect(RawQuoteSchema.safeParse(full).success).toBe(true);
  });

  it("rejects a malformed nested permit2 domain", () => {
    // Grafted on after the factory: `makeRawQuote` parses its input, so invalid
    // data passed to it would throw there instead of reaching the assertion.
    const bad = {
      ...makeRawQuote(),
      customFields: { permitData: { ...permitData, domain: { name: "Permit2", chainId: "1" } } },
    };

    expect(RawQuoteSchema.safeParse(bad).success).toBe(false);
  });
});
