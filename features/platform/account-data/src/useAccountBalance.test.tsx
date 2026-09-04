import React, { type ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AccountIdSchema } from "@shared/schema-primitives";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import {
  mockAccountBalance,
  mockTokenAccountBalance,
} from "@domain/entity-account-balance/schema.mock";
import { registerAccountBalanceSources } from "./register";
import { useAccountBalance } from "./useAccountBalance";
import type { AccountBalanceSource, AccountRef } from "./source";

const accountId = AccountIdSchema.parse("js:2:ethereum:0xabc:");
const ref: AccountRef = {
  accountId,
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
};

const makeStore = () =>
  configureStore({ reducer: { accountBalances: accountBalancesSlice.reducer } });

const wrapperFor = (store: ReturnType<typeof makeStore>) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };

const countingSource = (): AccountBalanceSource & { calls: () => number } => {
  let calls = 0;
  return {
    id: "granular",
    priority: 10,
    supports: () => true,
    getBalances: async () => {
      calls++;
      return [mockAccountBalance(), mockTokenAccountBalance()];
    },
    calls: () => calls,
  };
};

describe("useAccountBalance", () => {
  afterEach(() => registerAccountBalanceSources([]));

  it("reads on mount and exposes the account row and its token rows", async () => {
    registerAccountBalanceSources([countingSource()]);
    const store = makeStore();
    const { result } = renderHook(() => useAccountBalance(ref), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(result.current.balance).toEqual(mockAccountBalance()));
    expect(result.current.subAccountBalances).toEqual([mockTokenAccountBalance()]);
    expect(result.current.status).toEqual({ pending: false, sourceId: "granular" });
  });

  it("reads once for many components on the same account", async () => {
    const source = countingSource();
    registerAccountBalanceSources([source]);
    const store = makeStore();
    const wrapper = wrapperFor(store);

    renderHook(() => useAccountBalance(ref), { wrapper });
    renderHook(() => useAccountBalance(ref), { wrapper });
    const { result } = renderHook(() => useAccountBalance(ref), { wrapper });

    await waitFor(() => expect(result.current.balance).toBeDefined());
    expect(source.calls()).toBe(1);
  });

  it("does not re-read when the caller rebuilds an equivalent ref", async () => {
    const source = countingSource();
    registerAccountBalanceSources([source]);
    const store = makeStore();
    const { result, rerender } = renderHook(() => useAccountBalance({ ...ref }), {
      wrapper: wrapperFor(store),
    });

    await waitFor(() => expect(result.current.balance).toBeDefined());
    rerender();
    rerender();
    expect(source.calls()).toBe(1);
  });

  it("re-reads when the address behind the same id changes", async () => {
    const source = countingSource();
    registerAccountBalanceSources([source]);
    const store = makeStore();
    let current = ref;
    const { rerender } = renderHook(() => useAccountBalance(current), {
      wrapper: wrapperFor(store),
    });

    await waitFor(() => expect(source.calls()).toBe(1));
    current = { ...ref, address: "0xdef" };
    rerender();
    await waitFor(() => expect(source.calls()).toBe(2));
  });

  it("forces a round-trip on refresh", async () => {
    const source = countingSource();
    registerAccountBalanceSources([source]);
    const store = makeStore();
    const { result } = renderHook(() => useAccountBalance(ref), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(source.calls()).toBe(1));
    await act(async () => {
      await result.current.refresh();
    });
    expect(source.calls()).toBe(2);
  });

  it("reads a token account's row without triggering anything", async () => {
    const source = countingSource();
    registerAccountBalanceSources([source]);
    const store = makeStore();
    store.dispatch(
      accountBalancesSlice.actions.accountBalanceReceived({
        accountId,
        balances: [mockAccountBalance(), mockTokenAccountBalance()],
        sourceId: "granular",
      }),
    );

    const tokenRef: AccountRef = {
      ...ref,
      accountId: mockTokenAccountBalance().accountId,
      parentId: accountId,
    };
    const { result } = renderHook(() => useAccountBalance(tokenRef), {
      wrapper: wrapperFor(store),
    });

    expect(result.current.balance).toEqual(mockTokenAccountBalance());
    expect(source.calls()).toBe(0);
  });

  it("surfaces a read failure on the status", async () => {
    registerAccountBalanceSources([
      {
        id: "granular",
        priority: 10,
        supports: () => true,
        getBalances: async () => {
          throw new Error("network down");
        },
      },
    ]);
    const store = makeStore();
    const { result } = renderHook(() => useAccountBalance(ref), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(result.current.status.error).toBe("network down"));
    expect(result.current.balance).toBeUndefined();
  });

  it("does nothing without a ref", () => {
    const source = countingSource();
    registerAccountBalanceSources([source]);
    const store = makeStore();
    const { result } = renderHook(() => useAccountBalance(undefined), {
      wrapper: wrapperFor(store),
    });

    expect(result.current.balance).toBeUndefined();
    expect(result.current.status).toEqual({ pending: false });
    expect(source.calls()).toBe(0);
  });
});
