/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { createTestStore, createWrapper } from "@tests/test-helpers/testUtils";
import { counterValuesApi as api } from "../../state-manager/api";
import { useUsdToFiatRate } from "../useUsdToFiatRate";

const mockUseQuery = jest
  .fn()
  .mockReturnValue({ data: undefined, isLoading: false, isError: false });

jest.mock("../../state-manager/api", () => ({
  ...jest.requireActual("../../state-manager/api"),
  useGetUsdToFiatRateQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

let store: ReturnType<typeof createTestStore>;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  store = createTestStore([api]);
});

afterEach(() => {
  store.dispatch(api.util.resetApiState());
});

describe("useUsdToFiatRate", () => {
  it("returns a rate of 1 for USD without calling the query", () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useUsdToFiatRate("USD"), { wrapper });

    expect(result.current).toEqual({ status: "ready", rate: 1, ticker: "USD" });
    expect(mockUseQuery).toHaveBeenCalledWith(
      { to: "usd" },
      expect.objectContaining({ skip: true }),
    );
  });

  it("is case-insensitive on the USD short-circuit", () => {
    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useUsdToFiatRate("usd"), { wrapper });

    expect(result.current).toEqual({ status: "ready", rate: 1, ticker: "USD" });
  });

  it("returns loading while the query is pending", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useUsdToFiatRate("EUR"), { wrapper });

    expect(result.current).toEqual({ status: "loading" });
  });

  it("returns error when the query errors", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useUsdToFiatRate("EUR"), { wrapper });

    expect(result.current).toEqual({ status: "error" });
  });

  it("returns error when the query resolves with a null rate", () => {
    mockUseQuery.mockReturnValue({ data: null, isLoading: false, isError: false });

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useUsdToFiatRate("EUR"), { wrapper });

    expect(result.current).toEqual({ status: "error" });
  });

  it("returns the resolved rate on success", () => {
    mockUseQuery.mockReturnValue({ data: 0.9, isLoading: false, isError: false });

    const wrapper = createWrapper(store);
    const { result } = renderHook(() => useUsdToFiatRate("eur"), { wrapper });

    expect(result.current).toEqual({ status: "ready", rate: 0.9, ticker: "EUR" });
  });

  it("passes a lowercased target and a 60s polling interval to the query", () => {
    const wrapper = createWrapper(store);
    renderHook(() => useUsdToFiatRate("EUR"), { wrapper });

    expect(mockUseQuery).toHaveBeenCalledWith(
      { to: "eur" },
      { skip: false, pollingInterval: 60_000 },
    );
  });
});
