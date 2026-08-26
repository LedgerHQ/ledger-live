import { renderHook, act } from "@testing-library/react-native";
import { mmkv } from "LLM/storage/mmkvStorageWrapper";
import { usePersistedPortfolioBalance } from "../usePersistedPortfolioBalance";
import type { SyncPhase } from "@ledgerhq/live-common/bridge/react/index";

const CURRENCY = "USD";
const KEY = `portfolioLastKnownBalance_${CURRENCY}`;
let store: Record<string, unknown> = {};

let getNumberSpy: jest.SpyInstance;
let setSpy: jest.SpyInstance;
let containsSpy: jest.SpyInstance;

beforeEach(() => {
  store = {};
  getNumberSpy = jest.spyOn(mmkv, "getNumber").mockImplementation((k: string) => {
    const v = store[k];
    return typeof v === "number" ? v : undefined;
  });
  containsSpy = jest.spyOn(mmkv, "contains").mockImplementation((k: string) => k in store);
  setSpy = jest.spyOn(mmkv, "set").mockImplementation((k: string, v: unknown) => {
    store[k] = v;
  });
});

afterEach(() => {
  getNumberSpy.mockRestore();
  setSpy.mockRestore();
  containsSpy.mockRestore();
});

describe("usePersistedPortfolioBalance", () => {
  it("returns latestBalance when non-zero", () => {
    const { result } = renderHook(() =>
      usePersistedPortfolioBalance(1500, "synced", CURRENCY, true),
    );
    expect(result.current).toBe(1500);
  });

  it("falls back to a complete MMKV cache while the live balance is incomplete during syncing", () => {
    store[KEY] = 3000;
    const { result } = renderHook(() =>
      usePersistedPortfolioBalance(1500, "syncing", CURRENCY, false),
    );
    expect(result.current).toBe(3000);
  });

  it("returns undefined when the live balance is incomplete and no cache exists", () => {
    const { result } = renderHook(() =>
      usePersistedPortfolioBalance(1500, "syncing", CURRENCY, false),
    );
    expect(result.current).toBeUndefined();
  });

  it("does not restore a cached value after an incomplete sync settles", () => {
    store[KEY] = 3000;
    const { result } = renderHook(() =>
      usePersistedPortfolioBalance(1500, "synced", CURRENCY, false),
    );
    expect(result.current).toBeUndefined();
  });

  it("recognizes a cached zero as a valid complete value", () => {
    store[KEY] = 0;
    const { result } = renderHook(() =>
      usePersistedPortfolioBalance(1500, "syncing", CURRENCY, false),
    );
    expect(result.current).toBe(0);
  });

  it("persists balance on synced, including zero (authoritative empty portfolio)", () => {
    const { rerender } = renderHook(
      ({ balance, phase }: { balance: number; phase: SyncPhase }) =>
        usePersistedPortfolioBalance(balance, phase, CURRENCY, true),
      { initialProps: { balance: 2500, phase: "syncing" as SyncPhase } },
    );

    expect(store[KEY]).toBeUndefined();

    act(() => rerender({ balance: 2500, phase: "synced" }));
    expect(store[KEY]).toBe(2500);

    // A real $0 portfolio must overwrite the stale cached value.
    act(() => rerender({ balance: 0, phase: "synced" }));
    expect(store[KEY]).toBe(0);
  });

  it("does not persist an incomplete balance", () => {
    store[KEY] = 3000;
    const { rerender } = renderHook(
      ({ balance, phase, complete }: { balance: number; phase: SyncPhase; complete: boolean }) =>
        usePersistedPortfolioBalance(balance, phase, CURRENCY, complete),
      {
        initialProps: {
          balance: 3000,
          phase: "syncing" as SyncPhase,
          complete: false,
        },
      },
    );

    act(() => rerender({ balance: 1234, phase: "synced", complete: false }));
    expect(store[KEY]).toBe(3000);
  });

  it("reloads cached value from MMKV when currency switches", () => {
    store[`portfolioLastKnownBalance_USD`] = 1000;
    store[`portfolioLastKnownBalance_EUR`] = 900;

    const { result, rerender } = renderHook(
      ({ currency }: { currency: string }) =>
        usePersistedPortfolioBalance(0, "syncing", currency, false),
      { initialProps: { currency: "USD" } },
    );

    expect(result.current).toBe(1000);

    act(() => rerender({ currency: "EUR" }));
    expect(result.current).toBe(900);
  });
});
