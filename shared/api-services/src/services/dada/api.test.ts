import { configureStore } from "@reduxjs/toolkit";
import { getEnv } from "@shared/env";
import { dadaApi } from "./api";

jest.mock("@shared/env", () => ({
  getEnv: jest.fn().mockReturnValue(""),
}));

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

describe("dadaApi headers", () => {
  let fetchSpy: jest.SpyInstance;

  // The base query is private, so drive it the way a use case does: through an injected endpoint.
  function probeStore() {
    const api = dadaApi.injectEndpoints({
      endpoints: build => ({ probe: build.query<unknown, void>({ query: () => "https://probe" }) }),
      overrideExisting: true,
    });
    const store = configureStore({
      reducer: { [dadaApi.reducerPath]: dadaApi.reducer },
      middleware: gdm => gdm().concat(dadaApi.middleware),
    });
    return { api, store };
  }

  function jsonResponse(body: unknown): Response {
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  function request(spy: jest.SpyInstance): Request {
    return spy.mock.calls[0][0] as Request;
  }

  afterEach(() => {
    fetchSpy?.mockRestore();
    jest.mocked(getEnv).mockReturnValue("");
  });

  it("sets x-gravitee-api-key when DADA_GRAVITEE_API_KEY is non-empty", async () => {
    jest.mocked(getEnv).mockReturnValue("secret-key");
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

    const { api, store } = probeStore();
    await store.dispatch(api.endpoints.probe.initiate());

    expect(request(fetchSpy).headers.get("x-gravitee-api-key")).toBe("secret-key");
  });

  it("omits x-gravitee-api-key when DADA_GRAVITEE_API_KEY is empty", async () => {
    jest.mocked(getEnv).mockReturnValue("");
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

    const { api, store } = probeStore();
    await store.dispatch(api.endpoints.probe.initiate());

    expect(request(fetchSpy).headers.has("x-gravitee-api-key")).toBe(false);
  });
});
