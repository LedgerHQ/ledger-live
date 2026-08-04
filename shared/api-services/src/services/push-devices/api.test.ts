import { configureStore } from "@reduxjs/toolkit";
import { pushDevicesApi, pushDevicesApiExtra } from "./api";

const valid = { pushDevicesServiceUrl: "https://push.test", ledgerClientVersion: "1.2.3" };

// Captured at import time: the base query tests below inject into this same api object.
const OWN_ENDPOINT_NAMES = Object.keys(pushDevicesApi.endpoints);

describe("pushDevicesApi", () => {
  it("has the correct reducer path", () => {
    expect(pushDevicesApi.reducerPath).toBe("pushDevicesApi");
  });

  it("declares no endpoints of its own", () => {
    expect(OWN_ENDPOINT_NAMES).toHaveLength(0);
  });
});

describe("pushDevicesApiExtra", () => {
  it("returns the validated config", () => {
    expect(pushDevicesApiExtra(valid)).toEqual(valid);
  });

  it("trims the service url and allows it to be empty, which disables sync", () => {
    expect(pushDevicesApiExtra({ ...valid, pushDevicesServiceUrl: "  " })).toEqual({
      ...valid,
      pushDevicesServiceUrl: "",
    });
  });

  it("throws when the client version is missing or blank", () => {
    // @ts-expect-error — ledgerClientVersion is required
    expect(() => pushDevicesApiExtra({ pushDevicesServiceUrl: "https://push.test" })).toThrow();
    expect(() => pushDevicesApiExtra({ ...valid, ledgerClientVersion: "  " })).toThrow();
  });
});

describe("pushDevicesBaseQuery", () => {
  let fetchSpy: jest.SpyInstance;

  // The base query is private, so drive it the way a use case does: through an injected endpoint.
  function probeStore(extra?: unknown) {
    const api = pushDevicesApi.injectEndpoints({
      endpoints: build => ({ probe: build.query<unknown, void>({ query: () => "/probe" }) }),
      overrideExisting: true,
    });
    const store = configureStore({
      reducer: { [pushDevicesApi.reducerPath]: pushDevicesApi.reducer },
      middleware: gdm => gdm({ thunk: { extraArgument: extra } }).concat(pushDevicesApi.middleware),
    });
    return { api, store };
  }

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("resolves requests against the configured service url, with the ledger headers", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const { api, store } = probeStore(pushDevicesApiExtra(valid));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(result.data).toEqual({ ok: true });
    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toBe("https://push.test/probe");
    expect(request.headers.get("Content-Type")).toBe("application/json");
    expect(request.headers.get("X-Ledger-Client-Version")).toBe("1.2.3");
  });

  it("soft-fails without retrying when the extraArgument is not configured", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch");

    const { api, store } = probeStore();
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: "pushDevicesApiExtra not configured in store extraArgument",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("soft-fails without retrying when the service url is empty, which disables sync", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch");

    const { api, store } = probeStore(pushDevicesApiExtra({ ...valid, pushDevicesServiceUrl: "" }));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: "pushDevicesServiceUrl is empty — sync is disabled",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
