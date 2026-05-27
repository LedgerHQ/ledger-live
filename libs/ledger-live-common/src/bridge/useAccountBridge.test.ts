/**
 * @jest-environment jsdom
 */
import "../__tests__/test-helpers/dom-polyfill";
import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { renderHook, act } from "@testing-library/react";
import { genAccount } from "../mock/account";
import { setSupportedCurrencies } from "../currencies";
import { useAccountBridge, useAccountBridgeMany } from "./useAccountBridge";
import { getAccountBridge } from ".";

const BTC = getCryptoCurrencyById("bitcoin");
const ETH = getCryptoCurrencyById("ethereum");
setSupportedCurrencies(["bitcoin", "ethereum"]);

const suspenseWrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Suspense, { fallback: null }, children);

describe("useAccountBridge", () => {
  beforeAll(async () => {
    // Warm the bridge cache so the synchronous test can read it without suspending.
    await getAccountBridge(genAccount("warmup-btc", { currency: BTC }));
    await getAccountBridge(genAccount("warmup-eth", { currency: ETH }));
  });

  test("returns bridge synchronously without a Suspense boundary", () => {
    const account = genAccount("mocked-account-sync", { currency: BTC });

    // No suspenseWrapper — if useAccountBridge suspended it would throw here
    const { result } = renderHook(() => useAccountBridge(account));

    expect(typeof result.current.createTransaction).toBe("function");
    expect(typeof result.current.updateTransaction).toBe("function");
    expect(typeof result.current.prepareTransaction).toBe("function");
  });

  test("returns a bridge with createTransaction for a BTC account", async () => {
    const account = genAccount("mocked-account-1", { currency: BTC });

    let result: ReturnType<typeof renderHook<ReturnType<typeof useAccountBridge>, void>>["result"];
    await act(async () => {
      ({ result } = renderHook(() => useAccountBridge(account), { wrapper: suspenseWrapper }));
      // Two microtask ticks: one for "await getAccountBridge", one for React's wakeUp to fire.
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(typeof result!.current.createTransaction).toBe("function");
    expect(typeof result!.current.updateTransaction).toBe("function");
    expect(typeof result!.current.prepareTransaction).toBe("function");
  });
});

describe("useAccountBridgeMany", () => {
  beforeAll(async () => {
    await getAccountBridge(genAccount("warmup-many-btc", { currency: BTC }));
    await getAccountBridge(genAccount("warmup-many-eth", { currency: ETH }));
  });

  test("returns one bridge per account, in order", () => {
    const accounts = [
      genAccount("multi-btc", { currency: BTC }),
      genAccount("multi-eth", { currency: ETH }),
    ];
    const { result } = renderHook(() => useAccountBridgeMany(accounts));

    expect(result.current).toHaveLength(2);
    expect(typeof result.current[0].isAccountEmpty).toBe("function");
    expect(typeof result.current[1].isAccountEmpty).toBe("function");
  });

  test("returns an empty array for no accounts", () => {
    const { result } = renderHook(() => useAccountBridgeMany([]));
    expect(result.current).toEqual([]);
  });
});
