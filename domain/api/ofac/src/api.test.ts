import { configureStore } from "@reduxjs/toolkit";
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import { ofacApi, useCheckQuery } from "./api";

// Wired the way the apps wire it: the store registers the service api, and the endpoint only
// exists because importing this package injected it.
const makeStore = () =>
  configureStore({
    reducer: { [countervaluesApi.reducerPath]: countervaluesApi.reducer },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: cvsApiExtra({
            getCountervaluesServiceUrl: () => "https://cvs.test",
          }),
        },
      }).concat(countervaluesApi.middleware),
  });

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let fetchSpy: jest.SpyInstance;

afterEach(() => {
  fetchSpy?.mockRestore();
});

describe("ofacApi configuration", () => {
  it("has the Countervalues service reducer path", () => {
    expect(ofacApi.reducerPath).toBe("countervaluesApi");
  });

  it("is the Countervalues service api, mutated in place by injectEndpoints", () => {
    expect(ofacApi).toBe(countervaluesApi);
  });

  it("exposes the check endpoint and its hook", () => {
    expect(ofacApi.endpoints.check).toBeDefined();
    expect(useCheckQuery).toBeDefined();
  });
});

describe("ofacApi check", () => {
  it("hits the injected base URL", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(json({}, 200));
    const store = makeStore();

    await store.dispatch(ofacApi.endpoints.check.initiate());

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toBe("https://cvs.test/v3/markets");
    expect(request.headers.get("Accept")).toBe("application/json");
  });

  it("returns false on HTTP 200", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(json({}, 200));
    const store = makeStore();

    const result = await store.dispatch(ofacApi.endpoints.check.initiate());

    expect(result.data).toBe(false);
    expect(result.error).toBeUndefined();
  });

  it("returns true on HTTP 451", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(json({}, 451));
    const store = makeStore();

    const result = await store.dispatch(ofacApi.endpoints.check.initiate());

    expect(result.data).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("surfaces other HTTP statuses as a query error without retrying", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => Promise.resolve(json({ error: "no" }, 500)));
    const store = makeStore();

    const result = await store.dispatch(ofacApi.endpoints.check.initiate());

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("surfaces a network failure as a query error without retrying", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => Promise.reject(new Error("network error")));
    const store = makeStore();

    const result = await store.dispatch(ofacApi.endpoints.check.initiate());

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
