/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { setCountervaluesLogger } from "./setCountervaluesLogger";
import { useUsdToFiatRate } from "./useUsdToFiatRate";

const mockUseQuery = jest
  .fn()
  .mockReturnValue({ data: undefined, isLoading: false, isError: false });

jest.mock("@domain/api-market-countervalues", () => ({
  ...jest.requireActual("@domain/api-market-countervalues"),
  useGetUsdToFiatRateQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

const log = jest.fn();
setCountervaluesLogger(log);

beforeEach(() => {
  jest.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
});

describe("useUsdToFiatRate", () => {
  it("returns a rate of 1 for USD with skip enabled (without firing a request)", () => {
    const { result } = renderHook(() => useUsdToFiatRate("USD"));

    expect(result.current).toEqual({ status: "ready", rate: 1 });
    expect(mockUseQuery).toHaveBeenCalledWith(
      { to: "usd" },
      expect.objectContaining({ skip: true }),
    );
  });

  it("is case-insensitive on the USD short-circuit", () => {
    const { result } = renderHook(() => useUsdToFiatRate("usd"));

    expect(result.current).toEqual({ status: "ready", rate: 1 });
  });

  it("returns a ready no-op rate when explicitly skipped", () => {
    const { result } = renderHook(() => useUsdToFiatRate("COP", { skip: true }));

    expect(result.current).toEqual({ status: "ready", rate: 1 });
    expect(mockUseQuery).toHaveBeenCalledWith(
      { to: "cop" },
      expect.objectContaining({ skip: true }),
    );
  });

  it("returns loading while the query is pending", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    const { result } = renderHook(() => useUsdToFiatRate("EUR"));

    expect(result.current).toEqual({ status: "loading", rate: null });
  });

  it("returns error when the query errors", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    const { result } = renderHook(() => useUsdToFiatRate("EUR"));

    expect(result.current).toEqual({ status: "error", rate: null });
  });

  it("logs the failure, so a rejected response stays visible", () => {
    const error = { status: "CUSTOM_ERROR", error: "rawResponseSchema rejected the response" };
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, error });

    renderHook(() => useUsdToFiatRate("EUR"));

    expect(jest.mocked(log)).toHaveBeenCalledWith(
      "countervaluesApi",
      expect.stringContaining("eur"),
      { error },
    );
  });

  it("returns error when the query resolves with a null rate", () => {
    mockUseQuery.mockReturnValue({ data: null, isLoading: false, isError: false });

    const { result } = renderHook(() => useUsdToFiatRate("EUR"));

    expect(result.current).toEqual({ status: "error", rate: null });
  });

  it("returns the resolved rate on success", () => {
    mockUseQuery.mockReturnValue({ data: 0.9, isLoading: false, isError: false });

    const { result } = renderHook(() => useUsdToFiatRate("eur"));

    expect(result.current).toEqual({ status: "ready", rate: 0.9 });
  });

  it("passes a lowercased target and a 60s polling interval to the query", () => {
    renderHook(() => useUsdToFiatRate("EUR"));

    expect(mockUseQuery).toHaveBeenCalledWith(
      { to: "eur" },
      { skip: false, pollingInterval: 60_000 },
    );
  });

  it("keeps the returned object identity stable across re-renders when upstream state is unchanged", () => {
    mockUseQuery.mockReturnValue({ data: 0.9, isLoading: false, isError: false });

    const { result, rerender } = renderHook(() => useUsdToFiatRate("EUR"));

    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
