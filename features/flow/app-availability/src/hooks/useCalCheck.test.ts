import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { calApi, calApiExtra } from "@shared/api-services";
import { act, renderHook, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Provider } from "react-redux";
import { CAL_HEALTHCHECK_TIMEOUT_MS } from "./calHealth.internals";
import { useCalCheck } from "./useCalCheck";

const CAL_URL = "https://cal.test";
const CLIENT_VERSION = "1.2.3";
const server = setupServer();

function renderUseCalCheck(
  extraArgument: unknown = calApiExtra({
    calServiceUrl: CAL_URL,
    ledgerClientVersion: CLIENT_VERSION,
  }),
) {
  const store = configureStore({
    reducer: { [calApi.reducerPath]: calApi.reducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: { extraArgument },
      }).concat(calApi.middleware),
  });

  return renderHook(() => useCalCheck(), {
    wrapper: ({ children }) => React.createElement(Provider, { store, children }),
  });
}

describe("useCalCheck", () => {
  const calHealthcheck = process.env.CAL_HEALTHCHECK;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    server.resetHandlers();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (calHealthcheck === undefined) delete process.env.CAL_HEALTHCHECK;
    else process.env.CAL_HEALTHCHECK = calHealthcheck;
  });

  afterAll(() => {
    server.close();
  });

  it("should return pending while the healthcheck is in flight", async () => {
    server.use(
      http.get(`${CAL_URL}/v1/currencies`, async () => {
        await delay(50);
        return HttpResponse.json([{ id: "bitcoin" }]);
      }),
    );

    const { result } = renderUseCalCheck();

    expect(result.current).toEqual({ status: "pending" });

    await waitFor(() => {
      expect(result.current).toEqual({ status: "available" });
    });
  });

  it("should return available when CAL is healthy", async () => {
    let clientVersion: string | null = null;
    server.use(
      http.get(`${CAL_URL}/v1/currencies`, ({ request }) => {
        clientVersion = request.headers.get("X-Ledger-Client-Version");
        return HttpResponse.json([{ id: "bitcoin" }]);
      }),
    );

    const { result } = renderUseCalCheck();

    await waitFor(() => {
      expect(result.current).toEqual({ status: "available" });
    });
    expect(clientVersion).toBe(CLIENT_VERSION);
  });

  it("should return available when the device is offline", async () => {
    const onlineDescriptor = Object.getOwnPropertyDescriptor(navigator, "onLine");
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });

    const { result } = renderUseCalCheck();

    await waitFor(() => {
      expect(result.current).toEqual({ status: "available" });
    });

    if (onlineDescriptor === undefined) {
      Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    } else {
      Object.defineProperty(navigator, "onLine", onlineDescriptor);
    }
  });

  it("should return serviceUnavailable when the store has no CAL config", async () => {
    const { result } = renderUseCalCheck({});

    await waitFor(() => {
      expect(result.current).toEqual({
        status: "unavailable",
        reason: "serviceUnavailable",
      });
    });
  });

  it("should return unavailable with serviceUnavailable when CAL fails", async () => {
    server.use(http.get(`${CAL_URL}/v1/currencies`, () => new HttpResponse(null, { status: 503 })));

    const { result } = renderUseCalCheck();

    await waitFor(() => {
      expect(result.current).toEqual({
        status: "unavailable",
        reason: "serviceUnavailable",
      });
    });
  });

  it("should return available without fetching when CAL_HEALTHCHECK is ok", async () => {
    process.env.CAL_HEALTHCHECK = "ok";

    const { result } = renderUseCalCheck();

    await waitFor(() => {
      expect(result.current).toEqual({ status: "available" });
    });
  });

  it("should return serviceUnavailable without fetching when CAL_HEALTHCHECK is failed", async () => {
    process.env.CAL_HEALTHCHECK = "failed";

    const { result } = renderUseCalCheck();

    await waitFor(() => {
      expect(result.current).toEqual({
        status: "unavailable",
        reason: "serviceUnavailable",
      });
    });
  });

  it("should surface serviceUnavailable within the timeout when CAL never answers", async () => {
    jest.useFakeTimers();
    server.use(
      http.get(`${CAL_URL}/v1/currencies`, async () => {
        await delay("infinite");
        return HttpResponse.json([]);
      }),
    );

    const { result } = renderUseCalCheck();

    expect(result.current).toEqual({ status: "pending" });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(CAL_HEALTHCHECK_TIMEOUT_MS);
    });

    await waitFor(() => {
      expect(result.current).toMatchObject({
        status: "unavailable",
        reason: "serviceUnavailable",
      });
    });
  });
});
