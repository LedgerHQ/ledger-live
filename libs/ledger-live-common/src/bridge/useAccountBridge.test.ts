/**
 * @jest-environment jsdom
 */
import "../__tests__/test-helpers/dom-polyfill";
import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { renderHook, act } from "@testing-library/react";
import { genAccount } from "../mock/account";
import { setSupportedCurrencies } from "../currencies";
import { useAccountBridge } from "./useAccountBridge";
import { getAccountBridge } from ".";

const BTC = getCryptoCurrencyById("bitcoin");
setSupportedCurrencies(["bitcoin"]);

const suspenseWrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Suspense, { fallback: null }, children);

describe("useAccountBridge", () => {
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

  test("returns bridge synchronously after Promise is pre-settled (no Suspense needed)", async () => {
    const account = genAccount("mocked-account-pre-settled", { currency: BTC });

    // Pre-settle the bridge Promise before rendering
    await getAccountBridge(account);

    // The bridge Promise is now settled; use() should return synchronously — no Suspense needed.
    const { result } = renderHook(() => useAccountBridge(account));

    expect(typeof result.current.createTransaction).toBe("function");
    expect(typeof result.current.updateTransaction).toBe("function");
    expect(typeof result.current.prepareTransaction).toBe("function");
  });
});
