import { configureStore } from "@reduxjs/toolkit";
import { calApi, calApiExtra } from "@shared/api-services";
import { calProbeApi, useGetCalProbeQuery } from "./api";
import { PROBE_TIMEOUT_MS } from "./internals";

const makeStore = () =>
  configureStore({
    reducer: { [calApi.reducerPath]: calApi.reducer },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: calApiExtra({
            calServiceUrl: "https://cal.test",
            ledgerClientVersion: "1.2.3",
          }),
        },
      }).concat(calApi.middleware),
  });

const probe = () => {
  const store = makeStore();
  return store.dispatch(calProbeApi.endpoints.getCalProbe.initiate());
};

describe("getCalProbe", () => {
  let fetchSpy: jest.SpyInstance;
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
    else Reflect.deleteProperty(globalThis, "navigator");
    jest.useRealTimers();
  });

  it("is injected into the shared CAL api and exports the hook", () => {
    expect(calProbeApi).toBe(calApi);
    expect(useGetCalProbeQuery).toBeDefined();
  });

  it("returns ok on a 2xx, probing /v1/currencies with the client-version header", async () => {
    fetchSpy.mockResolvedValue(new Response("[]", { status: 200 }));

    const result = await probe();

    expect(result.data).toBe("ok");
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe("https://cal.test/v1/currencies?output=id&limit=1");
    expect(init.headers["X-Ledger-Client-Version"]).toBe("1.2.3");
  });

  it("returns failed on a 5xx and does not retry", async () => {
    fetchSpy.mockResolvedValue(new Response("boom", { status: 503 }));

    const result = await probe();

    expect(result.data).toBe("failed");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("returns failed when CAL does not answer within the timeout", async () => {
    jest.useFakeTimers();
    fetchSpy.mockImplementation(
      (_url: unknown, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("", "AbortError")));
        }),
    );

    const pending = probe();
    await jest.advanceTimersByTimeAsync(PROBE_TIMEOUT_MS);

    expect((await pending).data).toBe("failed");
  });

  it("returns offline on a network error", async () => {
    fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"));

    expect((await probe()).data).toBe("offline");
  });

  it("returns offline without calling CAL when the OS reports no connectivity", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: false },
      configurable: true,
    });

    expect((await probe()).data).toBe("offline");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("probes again on refetch", async () => {
    fetchSpy.mockResolvedValueOnce(new Response("x", { status: 500 }));
    fetchSpy.mockResolvedValueOnce(new Response("[]", { status: 200 }));

    const subscription = probe();
    expect((await subscription).data).toBe("failed");

    expect((await subscription.refetch()).data).toBe("ok");
  });
});
