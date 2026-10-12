import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import { ofacApi, useCheckQuery } from "./api";

const CHECK_URL = "https://cvs.test/v3/markets";

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
  const server = setupServer();

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });

  it("hits the injected base URL", async () => {
    let seen: Request | undefined;
    server.use(
      http.get(CHECK_URL, ({ request }) => {
        seen = request;
        return HttpResponse.json({});
      }),
    );
    const store = makeStore();

    await store.dispatch(ofacApi.endpoints.check.initiate());

    expect(seen?.url).toBe(CHECK_URL);
    expect(seen?.headers.get("Accept")).toBe("application/json");
  });

  it("returns false on HTTP 200", async () => {
    server.use(http.get(CHECK_URL, () => HttpResponse.json({})));
    const store = makeStore();

    const result = await store.dispatch(ofacApi.endpoints.check.initiate());

    expect(result.data).toBe(false);
    expect(result.error).toBeUndefined();
  });

  it("returns true on HTTP 451 with a non-JSON body", async () => {
    server.use(
      http.get(
        CHECK_URL,
        () =>
          new HttpResponse("<html><body>Unavailable for legal reasons</body></html>", {
            status: 451,
            headers: { "Content-Type": "text/html" },
          }),
      ),
    );
    const store = makeStore();

    const result = await store.dispatch(ofacApi.endpoints.check.initiate());

    expect(result.data).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("surfaces other HTTP statuses as a query error without retrying", async () => {
    let calls = 0;
    server.use(
      http.get(CHECK_URL, () => {
        calls += 1;
        return HttpResponse.json({ error: "no" }, { status: 500 });
      }),
    );
    const store = makeStore();

    const result = await store.dispatch(ofacApi.endpoints.check.initiate());

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(calls).toBe(1);
  });

  it("surfaces a network failure as a query error without retrying", async () => {
    let calls = 0;
    server.use(
      http.get(CHECK_URL, () => {
        calls += 1;
        return HttpResponse.error();
      }),
    );
    const store = makeStore();

    const result = await store.dispatch(ofacApi.endpoints.check.initiate());

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(calls).toBe(1);
  });
});
