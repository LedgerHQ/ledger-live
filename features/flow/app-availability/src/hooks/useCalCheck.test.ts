import { act, renderHook, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { CAL_HEALTHCHECK_TIMEOUT_MS } from "./calHealth.internals";
import { useCalCheck } from "./useCalCheck";

const CAL_URL = "https://cal.test";
const CLIENT_VERSION = "1.2.3";
const server = setupServer();

describe("useCalCheck", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    server.resetHandlers();
  });

  afterEach(() => {
    jest.useRealTimers();
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

    const { result } = renderHook(() => useCalCheck(CAL_URL, CLIENT_VERSION));

    expect(result.current).toEqual({ status: "pending" });

    await waitFor(() => {
      expect(result.current).toEqual({ status: "available" });
    });
  });

  it("should return available when CAL is healthy", async () => {
    server.use(http.get(`${CAL_URL}/v1/currencies`, () => HttpResponse.json([{ id: "bitcoin" }])));

    const { result } = renderHook(() => useCalCheck(CAL_URL, CLIENT_VERSION));

    await waitFor(() => {
      expect(result.current).toEqual({ status: "available" });
    });
  });

  it("should return available when the device is offline", async () => {
    const onlineDescriptor = Object.getOwnPropertyDescriptor(navigator, "onLine");
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });

    const { result } = renderHook(() => useCalCheck(CAL_URL, CLIENT_VERSION));

    await waitFor(() => {
      expect(result.current).toEqual({ status: "available" });
    });

    if (onlineDescriptor === undefined) {
      // jsdom always defines onLine; restore to true if we cannot restore the descriptor.
      Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    } else {
      Object.defineProperty(navigator, "onLine", onlineDescriptor);
    }
  });

  it("should return unavailable with serviceUnavailable when CAL fails", async () => {
    server.use(http.get(`${CAL_URL}/v1/currencies`, () => new HttpResponse(null, { status: 503 })));

    const { result } = renderHook(() => useCalCheck(CAL_URL, CLIENT_VERSION));

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

    const { result } = renderHook(() => useCalCheck(CAL_URL, CLIENT_VERSION));

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
