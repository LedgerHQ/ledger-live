import { configureStore } from "@reduxjs/toolkit";
import { cvsApi } from "./api";
import { SupportedFiatsResponseSchema } from "./schema";
import { resolveSupportedFiats } from "./utils";

describe("SupportedFiatsResponseSchema", () => {
  it("accepts an array of tickers", () => {
    expect(SupportedFiatsResponseSchema.parse(["USD", "EUR"])).toEqual(["USD", "EUR"]);
  });

  it("rejects a non-array payload", () => {
    expect(() => SupportedFiatsResponseSchema.parse({ USD: true })).toThrow();
  });
});

describe("resolveSupportedFiats", () => {
  it("resolves known tickers to FiatCurrency entities", () => {
    const resolved = resolveSupportedFiats(["USD", "EUR"]);
    expect(resolved.map(c => c.id)).toEqual(["usd", "eur"]);
    expect(resolved[0].type).toBe("FiatCurrency");
  });

  it("drops unknown tickers", () => {
    expect(resolveSupportedFiats(["USD", "XXX"]).map(c => c.id)).toEqual(["usd"]);
  });

  it("filters out OFAC currencies", () => {
    expect(resolveSupportedFiats(["USD", "RUB"]).map(c => c.id)).toEqual(["usd"]);
  });

  it("deduplicates repeated tickers", () => {
    expect(resolveSupportedFiats(["USD", "USD", "EUR"]).map(c => c.id)).toEqual(["usd", "eur"]);
  });
});

describe("cvsApi.getSupportedFiats", () => {
  const makeStore = () =>
    configureStore({
      reducer: { [cvsApi.reducerPath]: cvsApi.reducer },
      middleware: gdm => gdm().concat(cvsApi.middleware),
    });

  it("fetches and validates the supported fiats payload", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(["USD", "EUR"]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const store = makeStore();
    const result = await store.dispatch(cvsApi.endpoints.getSupportedFiats.initiate());

    expect(result.data).toEqual(["USD", "EUR"]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toContain("/v3/supported/fiat");

    fetchSpy.mockRestore();
  });
});
