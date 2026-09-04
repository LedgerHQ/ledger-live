import type { FC, ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import { AccountDataProvider } from "../provider";
import { createAccountDataSourceRegistry } from "../registry";
import { createAccountDataScheduler } from "../scheduler";
import { fakeSource, makeRef } from "../port.mock";
import { useSliceStatuses } from "./useSliceStatus";

const ref = makeRef();

const setup = ({ fail, gate }: { fail?: Error; gate?: Promise<void> } = {}) => {
  const store = configureStore({ reducer: { accountBalances: accountBalancesSlice.reducer } });
  const scheduler = createAccountDataScheduler({
    registry: createAccountDataSourceRegistry([
      fakeSource({ id: "coin-module-api", priority: 10, capabilities: ["balance"], fail, gate }),
    ]),
    dispatch: store.dispatch,
  });
  const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <Provider store={store}>
      <AccountDataProvider scheduler={scheduler}>{children}</AccountDataProvider>
    </Provider>
  );
  return { scheduler, Wrapper };
};

const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

const ACCOUNT_IDS = [ref.accountId];

describe("useSliceStatuses", () => {
  it("re-renders while a fetch is pending, without any store change", async () => {
    let release = () => {};
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const { scheduler, Wrapper } = setup({ gate });

    const { result } = renderHook(() => useSliceStatuses(ACCOUNT_IDS, "balance"), {
      wrapper: Wrapper,
    });
    expect(result.current[0].pending).toBe(false);

    await act(async () => {
      void scheduler.fetch({ ref, slices: ["balance"], reason: "test", maxAge: 0 });
      await Promise.resolve();
    });
    // The point of the hook: pending is visible even though nothing was written to Redux yet.
    expect(result.current[0].pending).toBe(true);

    await act(async () => {
      release();
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(result.current[0].pending).toBe(false);
    scheduler.dispose();
  });

  it("surfaces a failure that writes no balance at all", async () => {
    const { scheduler, Wrapper } = setup({ fail: new Error("chain unreachable") });
    const { result } = renderHook(() => useSliceStatuses(ACCOUNT_IDS, "balance"), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await scheduler
        .fetch({ ref, slices: ["balance"], reason: "test", maxAge: 0 })
        .catch(() => {});
    });
    await settle();

    // A memo over `getStatus` could never show this: the fetch dispatched nothing, so no selector
    // ever changed identity.
    expect(result.current[0].error?.message).toBe("chain unreachable");
    scheduler.dispose();
  });

  it("keeps the same array when nothing changed, so a list does not re-render", async () => {
    const { scheduler, Wrapper } = setup();
    const { result, rerender } = renderHook(() => useSliceStatuses(ACCOUNT_IDS, "balance"), {
      wrapper: Wrapper,
    });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
    await settle();
    scheduler.dispose();
  });
});
