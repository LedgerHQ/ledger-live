import { countervaluesApi } from "@shared/api-services";
import {
  marketCountervaluesApi,
  describeSchemaFailure,
  useGetCounterValueIdsSortedByMarketCapQuery,
  useGetUsdToFiatRateQuery,
} from "./api";

describe("marketCountervaluesApi configuration", () => {
  test("is the shared Countervalues service api, mutated in place by injectEndpoints", () => {
    expect(marketCountervaluesApi).toBe(countervaluesApi);
  });

  test("uses the shared reducer path, so the apps register one countervalues slice", () => {
    expect(marketCountervaluesApi.reducerPath).toBe("countervaluesApi");
  });

  test("exposes the four endpoints", () => {
    expect(Object.keys(marketCountervaluesApi.endpoints)).toEqual(
      expect.arrayContaining([
        "getHistoricalRates",
        "getSpotRates",
        "getCounterValueIdsSortedByMarketCap",
        "getUsdToFiatRate",
      ]),
    );
  });

  test("exposes the hooks live-common's countervalues hooks consume", () => {
    expect(useGetCounterValueIdsSortedByMarketCapQuery).toBeDefined();
    expect(useGetUsdToFiatRateQuery).toBeDefined();
  });
});

describe("describeSchemaFailure", () => {
  test("carries the rejected paths and messages onto the error", () => {
    const out = describeSchemaFailure({
      issues: [{ path: ["bitcoin"], message: "expected number" }],
      schemaName: "rawResponseSchema",
    } as never);

    expect(out).toEqual({
      status: "CUSTOM_ERROR",
      error: "rawResponseSchema rejected the response — bitcoin: expected number",
    });
  });

  test("handles an issue with no path", () => {
    const out = describeSchemaFailure({
      issues: [{ message: "expected an array" }],
      schemaName: "responseSchema",
    } as never);

    expect(out).toEqual({
      status: "CUSTOM_ERROR",
      error: "responseSchema rejected the response — expected an array",
    });
  });
});
