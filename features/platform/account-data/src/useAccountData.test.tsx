import { startTransition, Suspense, type ReactNode } from "react";
import { Provider } from "react-redux";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { AccountDataSource, AccountTarget } from "@domain/api-account-data";
import {
  accountUUID,
  descriptor,
  descriptorOf,
  indexOf,
  makeStore,
  selectFeed,
  sourceIdOf,
} from "@domain/api-account-data/testing";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { useAccountData } from "./useAccountData";

function setup(read: AccountDataSource["read"]) {
  const store = makeStore([{ id: sourceIdOf("s"), supports: () => true, read }]);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, wrapper };
}

describe("useAccountData", () => {
  it("reads on mount and exposes the pending state", async () => {
    const counter = jest.fn(async () => 1);
    const { store, wrapper } = setup({ counter });
    const { result } = renderHook(() => useAccountData("counter", descriptor), { wrapper });
    expect(result.current.pending).toBe(true);
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(store.getState().counter[accountUUID]).toBe(1);
    expect(counter).toHaveBeenCalledTimes(1);
  });

  it("exposes the UUID the entity slices key the account by", async () => {
    const { wrapper } = setup({ counter: async () => 1 });
    const { result } = renderHook(() => useAccountData("counter", descriptor), { wrapper });
    expect(result.current.accountUUID).toBe(accountUUID);
    await waitFor(() => expect(result.current.pending).toBe(false));
  });

  it("does nothing without a descriptor", () => {
    const counter = jest.fn(async () => 1);
    const { wrapper } = setup({ counter });
    const { result } = renderHook(() => useAccountData("counter", undefined), { wrapper });
    expect(result.current).toEqual(
      expect.objectContaining({ accountUUID: undefined, pending: false }),
    );
    expect(counter).not.toHaveBeenCalled();
  });

  it("does not read again on a re-render with an equal descriptor and inline query", async () => {
    const feed = jest.fn(async () => ({ items: ["a"] }));
    const { wrapper } = setup({ feed });
    const { result, rerender } = renderHook(
      () => useAccountData("feed", { ...descriptor }, { query: { limit: 10 }, maxAge: 0 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    rerender();
    expect(feed).toHaveBeenCalledTimes(1);
  });

  it("reads again when the account changes", async () => {
    const counter = jest.fn(async () => 1);
    const { wrapper } = setup({ counter });
    const { result, rerender } = renderHook(
      ({ account }: { account: AccountDescriptor }) => useAccountData("counter", account),
      { wrapper, initialProps: { account: descriptorOf(0) } },
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    rerender({ account: descriptorOf(1) });
    await waitFor(() => expect(counter).toHaveBeenCalledTimes(2));
  });

  it("keeps the callbacks on the shown account while a transition to another one suspends", async () => {
    const counter = jest.fn(async (target: AccountTarget) => indexOf(target));
    const { wrapper } = setup({ counter });
    const never = new Promise<never>(() => undefined);
    const suspending = ({ children }: { children: ReactNode }) =>
      wrapper({ children: <Suspense fallback={null}>{children}</Suspense> });
    const { result, rerender } = renderHook(
      ({ index }: { index: number }) => {
        const data = useAccountData("counter", descriptorOf(index));
        if (index === 1) throw never;
        return data;
      },
      { wrapper: suspending, initialProps: { index: 0 } },
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    act(() => startTransition(() => rerender({ index: 1 })));
    await act(() => result.current.refresh());
    expect(counter).toHaveBeenCalledTimes(2);
    expect(counter.mock.lastCall?.[0].descriptor).toEqual(descriptorOf(0));
  });

  it("refreshes whatever the freshness", async () => {
    const counter = jest.fn(async () => 1);
    const { wrapper } = setup({ counter });
    const { result } = renderHook(() => useAccountData("counter", descriptor), { wrapper });
    await waitFor(() => expect(result.current.pending).toBe(false));
    await act(() => result.current.refresh());
    expect(counter).toHaveBeenCalledTimes(2);
  });

  it("exposes the error of the last read", async () => {
    const { wrapper } = setup({ counter: async () => Promise.reject(new RangeError("down")) });
    const { result } = renderHook(() => useAccountData("counter", descriptor), { wrapper });
    await waitFor(() =>
      expect(result.current.error).toEqual({ name: "RangeError", message: "down" }),
    );
  });

  it("loads the next page while there is one", async () => {
    const feed = jest.fn(async (target: AccountTarget) =>
      target.cursor === "c1" ? { items: ["b"] } : { items: ["a"], nextCursor: "c1" },
    );
    const { store, wrapper } = setup({ feed });
    const { result } = renderHook(() => useAccountData("feed", descriptor), { wrapper });
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    await act(() => result.current.loadMore());
    expect(selectFeed(store.getState(), accountUUID)).toEqual(["a", "b"]);
    expect(result.current.hasMore).toBe(false);
  });
});
