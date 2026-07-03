import { renderHook, act } from "@testing-library/react-native";
import { mmkv } from "LLM/storage/mmkvStorageWrapper";
import { usePersistedPortfolioBalance } from "../usePersistedPortfolioBalance";
import type { SyncPhase } from "@ledgerhq/live-common/bridge/react/index";

const CURRENCY = "USD";
const KEY = `portfolioLastKnownBalance_${CURRENCY}`;
let store: Record<string, unknown> = {};

let getNumberSpy: jest.SpyInstance;
let setSpy: jest.SpyInstance;

beforeEach(() => {
  store = {};
  getNumberSpy = jest.spyOn(mmkv, "getNumber").mockImplementation((k: string) => {
    const v = store[k];
    return typeof v === "number" ? v : undefined;
  });
  setSpy = jest.spyOn(mmkv, "set").mockImplementation((k: string, v: unknown) => {
    store[k] = v;
  });
});

afterEach(() => {
  getNumberSpy.mockRestore();
  setSpy.mockRestore();
});

describe("usePersistedPortfolioBalance", () => {
  it("returns latestBalance when non-zero", () => {
    const { result } = renderHook(() => usePersistedPortfolioBalance(1500, "synced", CURRENCY));
    expect(result.current).toBe(1500);
  });

  it("falls back to MMKV cache when latestBalance is 0 during syncing", () => {
    store[KEY] = 3000;
    const { result } = renderHook(() => usePersistedPortfolioBalance(0, "syncing", CURRENCY));
    expect(result.current).toBe(3000);
  });

  it("returns 0 when latestBalance is 0 and no cache exists", () => {
    const { result } = renderHook(() => usePersistedPortfolioBalance(0, "syncing", CURRENCY));
    expect(result.current).toBe(0);
  });

  it("returns 0 after sync completes even if cache has a stale non-zero value", () => {
    store[KEY] = 3000;
    const { result } = renderHook(() => usePersistedPortfolioBalance(0, "synced", CURRENCY));
    expect(result.current).toBe(0);
  });

  it("persists balance on synced, including zero (authoritative empty portfolio)", () => {
    const { rerender } = renderHook(
      ({ balance, phase }: { balance: number; phase: SyncPhase }) =>
        usePersistedPortfolioBalance(balance, phase, CURRENCY),
      { initialProps: { balance: 2500, phase: "syncing" as SyncPhase } },
    );

    expect(store[KEY]).toBeUndefined();

    act(() => rerender({ balance: 2500, phase: "synced" }));
    expect(store[KEY]).toBe(2500);

    // A real $0 portfolio must overwrite the stale cached value.
    act(() => rerender({ balance: 0, phase: "synced" }));
    expect(store[KEY]).toBe(0);
  });

  it("does not persist when syncPhase is failed", () => {
    store[KEY] = 3000;
    const { rerender } = renderHook(
      ({ balance, phase }: { balance: number; phase: SyncPhase }) =>
        usePersistedPortfolioBalance(balance, phase, CURRENCY),
      { initialProps: { balance: 3000, phase: "syncing" as SyncPhase } },
    );

    act(() => rerender({ balance: 1234, phase: "failed" }));
    expect(store[KEY]).toBe(3000); // stale cache untouched
  });

  it("reloads cached value from MMKV when currency switches", () => {
    store[`portfolioLastKnownBalance_USD`] = 1000;
    store[`portfolioLastKnownBalance_EUR`] = 900;

    const { result, rerender } = renderHook(
      ({ currency }: { currency: string }) => usePersistedPortfolioBalance(0, "syncing", currency),
      { initialProps: { currency: "USD" } },
    );

    expect(result.current).toBe(1000);

    act(() => rerender({ currency: "EUR" }));
    expect(result.current).toBe(900);
  });
});
