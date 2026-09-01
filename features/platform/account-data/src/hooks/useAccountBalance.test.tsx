import type { FC, ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import {
  mockAccountBalance,
  mockTokenAccountBalance,
} from "@domain/entity-account-balance/schema.mock";
import { AccountDataProvider } from "../provider";
import { createAccountDataSourceRegistry } from "../registry";
import { createAccountDataScheduler } from "../scheduler";
import { accountIdFor, fakeSource, makeRef } from "../port.mock";
import { useAccountBalance } from "./useAccountBalance";
import { useAccountDataDemand } from "./useAccountDataDemand";

const ref = makeRef();

const setup = ({
  onFetch = jest.fn(),
  registered = true,
}: { onFetch?: jest.Mock; registered?: boolean } = {}) => {
  const store = configureStore({ reducer: { accountBalances: accountBalancesSlice.reducer } });
  const sources = registered
    ? [fakeSource({ id: "coin-module-api", priority: 10, capabilities: ["balance"], onFetch })]
    : [];
  const scheduler = createAccountDataScheduler({
    registry: createAccountDataSourceRegistry(sources),
    dispatch: store.dispatch,
  });
  const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <Provider store={store}>
      <AccountDataProvider scheduler={scheduler}>{children}</AccountDataProvider>
    </Provider>
  );
  return { store, scheduler, Wrapper, onFetch };
};

/**
 * Let the scheduler's in-flight fetch settle inside `act`: it dispatches from a promise, so without
 * this React reports the resulting store update as an unwrapped update.
 */
const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

describe("useAccountBalance", () => {
  it("registers balance demand on mount and releases it on unmount", async () => {
    const { scheduler, Wrapper } = setup();
    const { unmount } = renderHook(() => useAccountBalance(ref), { wrapper: Wrapper });
    await settle();
    expect(scheduler.demandCount(ref.accountId, "balance")).toBe(1);
    unmount();
    expect(scheduler.demandCount(ref.accountId, "balance")).toBe(0);
    scheduler.dispose();
  });

  it("asks for nothing but balance", async () => {
    const { scheduler, Wrapper, onFetch } = setup();
    renderHook(() => useAccountBalance(ref), { wrapper: Wrapper });
    await settle();
    expect(onFetch.mock.calls[0][1]).toEqual(["balance"]);
    scheduler.dispose();
  });

  it("exposes the balance the source wrote, and the token accounts alongside it", async () => {
    const { scheduler, Wrapper } = setup();
    const { result } = renderHook(() => useAccountBalance(ref), { wrapper: Wrapper });
    await settle();
    expect(result.current.balance?.accountId).toBe(ref.accountId);
    expect(result.current.subAccountBalances).toHaveLength(1);
    scheduler.dispose();
  });

  it("reads a balance already in the store without waiting for a fetch", async () => {
    const { store, scheduler, Wrapper } = setup();
    store.dispatch(
      accountBalancesSlice.actions.upsertAccountBalances([
        mockAccountBalance({ accountId: ref.accountId }),
        mockTokenAccountBalance({ parentId: ref.accountId }),
      ]),
    );
    const { result } = renderHook(() => useAccountBalance(ref), { wrapper: Wrapper });
    expect(result.current.balance?.accountId).toBe(ref.accountId);
    await settle();
    scheduler.dispose();
  });

  it("reports pending then settled through the slice status", async () => {
    const { scheduler, Wrapper } = setup();
    const { result } = renderHook(() => useAccountBalance(ref), { wrapper: Wrapper });
    await settle();
    expect(result.current.status.lastFetchedAt).toBeDefined();
    expect(result.current.status.pending).toBe(false);
    expect(result.current.status.sourceId).toBe("coin-module-api");
    scheduler.dispose();
  });

  it("surfaces the routing error when nothing can serve the account", async () => {
    const { scheduler, Wrapper } = setup({ registered: false });
    const { result } = renderHook(() => useAccountBalance(ref), { wrapper: Wrapper });
    await settle();
    expect(result.current.status.error).toBeDefined();
    expect(result.current.balance).toBeUndefined();
    scheduler.dispose();
  });

  it("registers no demand for an empty slice list", async () => {
    const { scheduler, Wrapper, onFetch } = setup();
    renderHook(() => useAccountDataDemand([ref], []), { wrapper: Wrapper });
    await settle();
    expect(onFetch).not.toHaveBeenCalled();
    expect(scheduler.demandCount(ref.accountId, "balance")).toBe(0);
    scheduler.dispose();
  });

  it("does nothing without a ref", () => {
    const { scheduler, Wrapper, onFetch } = setup();
    const { result } = renderHook(() => useAccountBalance(undefined), { wrapper: Wrapper });
    expect(result.current.balance).toBeUndefined();
    expect(result.current.subAccountBalances).toEqual([]);
    expect(onFetch).not.toHaveBeenCalled();
    scheduler.dispose();
  });

  it("forces a round-trip on refresh", async () => {
    const { scheduler, Wrapper, onFetch } = setup();
    const { result } = renderHook(() => useAccountBalance(ref), { wrapper: Wrapper });
    await settle();
    expect(onFetch).toHaveBeenCalledTimes(1);
    await act(() => result.current.refresh());
    expect(onFetch).toHaveBeenCalledTimes(2);
    scheduler.dispose();
  });

  it("keeps one demand per account when two components read the same balance", async () => {
    const { scheduler, Wrapper, onFetch } = setup();
    renderHook(() => useAccountBalance(ref), { wrapper: Wrapper });
    renderHook(() => useAccountBalance(makeRef()), { wrapper: Wrapper });
    await settle();
    expect(onFetch).toHaveBeenCalledTimes(1);
    scheduler.dispose();
  });

  it("fetches each account separately when the refs differ", async () => {
    const { scheduler, Wrapper, onFetch } = setup();
    renderHook(() => useAccountBalance(ref), { wrapper: Wrapper });
    renderHook(
      () => useAccountBalance(makeRef({ accountId: accountIdFor("0xdef"), address: "0xdef" })),
      { wrapper: Wrapper },
    );
    await settle();
    expect(onFetch).toHaveBeenCalledTimes(2);
    scheduler.dispose();
  });
});
