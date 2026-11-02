/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { fetchCurrencyAll } from "../../api/v5";
import { useFetchCurrencyAll } from "./useFetchCurrencyAll";
import { useFilteredProviders } from "./useFilteredProviders";

function deferred<T>() {
  let resolve: ((value: T) => void) | undefined;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve: (value: T) => resolve?.(value) };
}

jest.mock("@features/platform-feature-flags", () => ({ useFeature: () => null }));
jest.mock("../../api/v5", () => ({ fetchCurrencyAll: jest.fn() }));
jest.mock("./useFilteredProviders", () => ({ useFilteredProviders: jest.fn() }));

const mockProviders = (state: Partial<ReturnType<typeof useFilteredProviders>>) =>
  jest
    .mocked(useFilteredProviders)
    .mockReturnValue({ providers: ["changelly"], loading: false, error: null, ...state });

describe("useFetchCurrencyAll", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProviders({});
  });

  it("is unresolved until the catalog arrives, then resolved with it", async () => {
    const catalog = deferred<string[]>();
    jest.mocked(fetchCurrencyAll).mockReturnValue(catalog.promise);

    const { result } = renderHook(() => useFetchCurrencyAll());

    expect(result.current.isResolved).toBe(false);
    expect(result.current.data).toEqual([]);

    catalog.resolve(["bitcoin"]);

    await waitFor(() => expect(result.current.isResolved).toBe(true));
    expect(result.current.data).toEqual(["bitcoin"]);
  });

  it("is resolved with an empty catalog when the providers fail", () => {
    mockProviders({ providers: [], error: new Error("providers") });

    const { result } = renderHook(() => useFetchCurrencyAll());

    expect(result.current.isResolved).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(fetchCurrencyAll).not.toHaveBeenCalled();
  });

  it("stays unresolved while the providers are loading", () => {
    mockProviders({ providers: [], loading: true });

    expect(renderHook(() => useFetchCurrencyAll()).result.current.isResolved).toBe(false);
  });
});
