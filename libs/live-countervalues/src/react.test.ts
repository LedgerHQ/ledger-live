import { useTrackingPairForAccounts } from "./react";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { renderHook, act } from "@testing-library/react";
import { getFiatCurrencyByTicker } from "@ledgerhq/cryptoassets";
import { inferTrackingPairForAccounts } from "./logic";
import { TrackingPair } from "./types";

describe("useTrackingPairForAccounts", () => {
  const accounts = Array(20)
    .fill(null)
    .map((_, i) => genAccount("test" + i));
  const usd = getFiatCurrencyByTicker("USD");
  const eur = getFiatCurrencyByTicker("EUR");
  const trackingPairs = inferTrackingPairForAccounts(accounts, usd);

  test("it returns same tracking pairs as when using inferTrackingPairForAccounts", async () => {
    const { result } = renderHook(() => useTrackingPairForAccounts(accounts, usd));
    await act(async () => {
      expect(result.current).toEqual(trackingPairs);
    });
  });

  test("a re-render preserve the reference", async () => {
    const { result, rerender } = renderHook(() => useTrackingPairForAccounts(accounts, usd));
    let initial: TrackingPair[] | undefined;
    await act(async () => {
      initial = result.current;
    });
    rerender();
    await act(async () => {
      expect(result.current).toBe(initial);
    });
  });

  test("a re-render preserve the reference even when accounts change", async () => {
    const { result, rerender } = renderHook(() =>
      useTrackingPairForAccounts(accounts.slice(0), usd),
    );
    let initial: TrackingPair[] | undefined;
    await act(async () => {
      initial = result.current;
    });
    rerender();
    await act(async () => {
      expect(result.current).toBe(initial);
    });
  });

  test("when accounts appears, it properly converge to the trackingPairs", async () => {
    const { result, rerender } = renderHook(added =>
      useTrackingPairForAccounts(!added ? [] : accounts, usd),
    );
    await act(async () => {
      expect(result.current).toEqual([]);
    });
    rerender(true);
    await act(async () => {
      expect(result.current).toEqual(trackingPairs);
    });
  });

  test("when accounts changes fundamentally, pairs change", async () => {
    const { result, rerender } = renderHook(empty =>
      useTrackingPairForAccounts(empty ? [] : accounts, usd),
    );
    await act(async () => {
      expect(result.current).toEqual(trackingPairs);
    });
    rerender(true);
    await act(async () => {
      expect(result.current).toEqual([]);
    });
  });

  test("when currency changes, pairs change", async () => {
    const { result, rerender } = renderHook(usesEur =>
      useTrackingPairForAccounts(accounts, usesEur ? eur : usd),
    );
    await act(async () => {
      expect(result.current).toEqual(trackingPairs);
    });
    rerender(true);
    await act(async () => {
      expect(result.current).not.toEqual(trackingPairs);
    });
  });

  test("if accounts reorder, it doesn't change", async () => {
    const reverse = accounts.slice(0).reverse();
    const { result, rerender } = renderHook(rev =>
      useTrackingPairForAccounts(rev ? reverse : accounts, usd),
    );
    let initial: TrackingPair[] | undefined;
    await act(async () => {
      initial = result.current;
    });
    rerender(true);
    await act(async () => {
      expect(result.current).toBe(initial);
    });
  });

  test("if accounts doubles, it doesn't change", async () => {
    const doubled = accounts.concat(accounts);
    const { result, rerender } = renderHook(d =>
      useTrackingPairForAccounts(d ? doubled : accounts, usd),
    );
    let initial: TrackingPair[] | undefined;
    await act(async () => {
      initial = result.current;
    });
    rerender(true);
    await act(async () => {
      expect(result.current).toBe(initial);
    });
  });
});
