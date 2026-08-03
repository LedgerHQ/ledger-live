import { llmRTKApiReducers } from "./rtkQueryApi";

/**
 * The registry keys itself off each api's `reducerPath`, so a wrong import, a duplicated backend or a
 * dropped api changes the store shape without failing typecheck. Pinning the exact set is the only
 * thing that catches it.
 *
 * `@domain/api-services` entries own one backend each; their endpoints are injected by the
 * matching `@domain/api-*` use-case packages, which the view-models import directly.
 */
const EXPECTED_REDUCER_PATHS = [
  "assetsDataApi",
  "calApi",
  "cgApi",
  "coinMarketCapApi",
  "counterValuesApi",
  "countervaluesApi",
  "marketApi",
  "ofacGeoBlockApi",
  "payCardApi",
  "pushDevicesApi",
] as const;

describe("llmRTKApiReducers", () => {
  it("registers exactly the expected reducer paths", () => {
    expect(Object.keys(llmRTKApiReducers).sort()).toEqual([...EXPECTED_REDUCER_PATHS]);
  });

  it("registers one reducer per backend, with no duplicates", () => {
    const paths = Object.keys(llmRTKApiReducers);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
