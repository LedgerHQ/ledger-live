/**
 * @jest-environment jsdom
 */
import "../__tests__/test-helpers/dom-polyfill";
import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { CurrencyNotSupported } from "@ledgerhq/errors";
import { render, renderHook, act, screen } from "@testing-library/react";
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

describe("useAccountBridge — unsupported account", () => {
  function makeUnsupportedAccount(id: string) {
    const account = genAccount(id, { currency: BTC });
    return { ...account, currency: getCryptoCurrencyById("tron") };
  }

  class Boundary extends React.Component<
    { children: React.ReactNode },
    { error: Error | null }
  > {
    state = { error: null as Error | null };
    static getDerivedStateFromError(error: Error) {
      return { error };
    }
    render() {
      if (this.state.error) {
        return React.createElement("span", { "data-testid": "err" }, this.state.error.message);
      }
      return this.props.children;
    }
  }

  // Hard cap surfaces the loop as a wrong error message rather than a Jest timeout.
  function HookProbe({
    account,
    cap = 50,
    counter,
  }: {
    account: ReturnType<typeof makeUnsupportedAccount>;
    cap?: number;
    counter: { n: number };
  }) {
    counter.n++;
    if (counter.n > cap) {
      throw new Error(`render loop detected (>${cap} renders)`);
    }
    useAccountBridge(account);
    return null;
  }

  async function flush() {
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  }

  test("does not enter a render loop on an unsupported account", async () => {
    const counter = { n: 0 };
    const account = makeUnsupportedAccount("loop-detect");
    await act(async () => {
      render(
        React.createElement(
          Boundary,
          null,
          React.createElement(
            React.Suspense,
            { fallback: null },
            React.createElement(HookProbe, { account, counter }),
          ),
        ),
      );
      await flush();
    });
    expect(counter.n).toBeLessThan(50);
    expect(screen.getByTestId("err").textContent).toMatch(/not supported/i);
  });

  test("error from useAccountBridge propagates to the ErrorBoundary with the right message", async () => {
    const counter = { n: 0 };
    const account = makeUnsupportedAccount("boundary-catch");
    await act(async () => {
      render(
        React.createElement(
          Boundary,
          null,
          React.createElement(
            React.Suspense,
            { fallback: React.createElement("span", { "data-testid": "fallback" }, "loading") },
            React.createElement(HookProbe, { account, cap: 100, counter }),
          ),
        ),
      );
      await flush();
    });
    expect(screen.queryByTestId("err")?.textContent).toMatch(/not supported/i);
    expect(screen.queryByTestId("fallback")).toBeNull();
  });

  test("rejection from getAccountBridge is identity-stable across direct calls", async () => {
    const account = makeUnsupportedAccount("direct-identity");
    const p1 = getAccountBridge(account);
    const p2 = getAccountBridge(account);
    p1.catch(() => {});
    expect(p1).toBe(p2);
    await expect(p1).rejects.toBeInstanceOf(CurrencyNotSupported);
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
