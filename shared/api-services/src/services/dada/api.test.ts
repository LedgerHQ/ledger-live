import { dadaApi } from "./api";

// Captured at import time: use-case packages inject into this same api object.
const OWN_ENDPOINT_NAMES = Object.keys(dadaApi.endpoints);

describe("dadaApi", () => {
  it("has the correct reducer path", () => {
    expect(dadaApi.reducerPath).toBe("assetsDataApi");
  });

  it("declares no endpoints of its own", () => {
    expect(OWN_ENDPOINT_NAMES).toHaveLength(0);
  });

  it("declares no tag types of its own", () => {
    // Use cases widen the union with enhanceEndpoints({ addTagTypes }).
    expect(dadaApi.util.getRunningQueriesThunk).toBeDefined();
  });
});
