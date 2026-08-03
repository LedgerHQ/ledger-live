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
