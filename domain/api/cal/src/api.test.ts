import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse, delay } from "msw";
import { setupServer } from "msw/node";
import { calApi, calApiExtra } from "@shared/api-services";
import { calProbeApi, useGetCalProbeQuery } from "./api";
import { PROBE_TIMEOUT_MS } from "./internals";

const CAL_SERVICE_URL = "https://cal.test";
const CURRENCIES_URL = `${CAL_SERVICE_URL}/v1/currencies`;
const REDIRECT_URL = "https://elsewhere.test/v1/currencies";

const makeStore = (calServiceUrl = CAL_SERVICE_URL) =>
  configureStore({
    reducer: { [calApi.reducerPath]: calApi.reducer },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: calApiExtra({
            calServiceUrl,
            ledgerClientVersion: "1.2.3",
          }),
        },
      }).concat(calApi.middleware),
  });

const probe = (calServiceUrl?: string) => {
  const store = makeStore(calServiceUrl);
  return store.dispatch(calProbeApi.endpoints.getCalProbe.initiate());
};

describe("getCalProbe", () => {
  const server = setupServer();
  const requested: string[] = [];
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
    server.events.on("request:start", ({ request }) => {
      requested.push(request.url);
    });
  });

  beforeEach(() => {
    requested.length = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
    server.resetHandlers();
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
    else Reflect.deleteProperty(globalThis, "navigator");
  });

  afterAll(() => {
    server.close();
  });

  it("is injected into the shared CAL api and exports the hook", () => {
    expect(calProbeApi).toBe(calApi);
    expect(useGetCalProbeQuery).toBeDefined();
  });

  it("returns ok on a 2xx, probing /v1/currencies with the client-version header", async () => {
    let seen: Request | undefined;
    server.use(
      http.get(CURRENCIES_URL, ({ request }) => {
        seen = request;
        return new HttpResponse("[]", { status: 200 });
      }),
    );

    const result = await probe();

    expect(result.data).toBe("ok");
    expect(seen?.url).toBe(`${CURRENCIES_URL}?output=id&limit=1`);
    expect(seen?.headers.get("X-Ledger-Client-Version")).toBe("1.2.3");
  });

  it("returns failed on a 5xx and does not retry", async () => {
    let calls = 0;
    server.use(
      http.get(CURRENCIES_URL, () => {
        calls += 1;
        return new HttpResponse("boom", { status: 503 });
      }),
    );

    const result = await probe();

    expect(result.data).toBe("failed");
    expect(calls).toBe(1);
  });

  it("returns failed on a redirect and does not request the redirect target", async () => {
    server.use(
      http.get(CURRENCIES_URL, () => HttpResponse.redirect(REDIRECT_URL, 302)),
      http.get(REDIRECT_URL, () => new HttpResponse("[]", { status: 200 })),
    );

    expect((await probe()).data).toBe("failed");
    expect(requested.some(url => url.startsWith(REDIRECT_URL))).toBe(false);
  });

  it("returns failed when CAL does not answer within the timeout", async () => {
    jest.useFakeTimers();
    server.use(
      http.get(CURRENCIES_URL, async () => {
        await delay(PROBE_TIMEOUT_MS + 1);
        return new HttpResponse("[]", { status: 200 });
      }),
    );

    const pending = probe();
    await jest.advanceTimersByTimeAsync(PROBE_TIMEOUT_MS);

    expect((await pending).data).toBe("failed");
  });

  it("returns failed, without calling CAL, when the service URL is malformed while offline", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: false },
      configurable: true,
    });

    const result = await probe("not a url");

    expect(result.data).toBe("failed");
    expect(requested).toEqual([]);
  });

  it("returns offline on a network error", async () => {
    server.use(http.get(CURRENCIES_URL, () => HttpResponse.error()));

    expect((await probe()).data).toBe("offline");
  });

  it("returns offline without calling CAL when the OS reports no connectivity", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: false },
      configurable: true,
    });
    server.use(http.get(CURRENCIES_URL, () => new HttpResponse("[]", { status: 200 })));

    expect((await probe()).data).toBe("offline");
    expect(requested).toEqual([]);
  });

  it("probes again on refetch", async () => {
    server.use(
      http.get(CURRENCIES_URL, () => new HttpResponse("x", { status: 500 }), { once: true }),
      http.get(CURRENCIES_URL, () => new HttpResponse("[]", { status: 200 })),
    );

    const subscription = probe();
    expect((await subscription).data).toBe("failed");

    expect((await subscription.refetch()).data).toBe("ok");
    expect(requested).toHaveLength(2);
  });
});
