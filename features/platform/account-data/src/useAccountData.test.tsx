import { startTransition, Suspense, type ReactNode } from "react";
import { Provider } from "react-redux";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { AccountDataSource, AccountTarget } from "@domain/api-account-data";
import {
  type FeedQuery,
  accountUUID,
  descriptor,
  descriptorOf,
  indexOf,
  selectFeed,
  sourceIdOf,
} from "@domain/api-account-data/testing";
import {
  AccountIdSchema,
  discoveredAccountsCleared,
  discoveredAccountsRegistered,
  legacyAccountsSynced,
  remoteAccountsAdded,
  type AccountUUID,
} from "@domain/entity-account";
import { makeStoreWithAccounts, uuidOf } from "./testStore.mock";
import { useAccountData } from "./useAccountData";

function setup(read: AccountDataSource["read"]) {
  const store = makeStoreWithAccounts([{ id: sourceIdOf("s"), supports: () => true, read }]);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, wrapper };
}

describe("useAccountData", () => {
  it("reads on mount and exposes the pending state", async () => {
    const counter = jest.fn(async () => 1);
    const { store, wrapper } = setup({ counter });
    const { result } = renderHook(() => useAccountData("counter", accountUUID), { wrapper });
    expect(result.current.pending).toBe(true);
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(store.getState().counter[accountUUID]).toBe(1);
    expect(counter).toHaveBeenCalledTimes(1);
  });

  it("exposes the UUID the entity slices key the account by", async () => {
    const { wrapper } = setup({ counter: async () => 1 });
    const { result } = renderHook(() => useAccountData("counter", accountUUID), { wrapper });
    expect(result.current.accountUUID).toBe(accountUUID);
    await waitFor(() => expect(result.current.pending).toBe(false));
  });

  it("does nothing without an account", () => {
    const counter = jest.fn(async () => 1);
    const { wrapper } = setup({ counter });
    const { result } = renderHook(() => useAccountData("counter", undefined), { wrapper });
    expect(result.current).toEqual(
      expect.objectContaining({ accountUUID: undefined, pending: false }),
    );
    expect(counter).not.toHaveBeenCalled();
  });

  it("does nothing for an account no slice holds", () => {
    const counter = jest.fn(async () => 1);
    const { wrapper } = setup({ counter });
    const { result } = renderHook(() => useAccountData("counter", uuidOf(9)), { wrapper });
    expect(result.current).toEqual(
      expect.objectContaining({ accountUUID: undefined, pending: false }),
    );
    expect(counter).not.toHaveBeenCalled();
  });

  it("does not read again on a re-render with an inline query", async () => {
    const feed = jest.fn(async () => ({ items: ["a"] }));
    const { wrapper } = setup({ feed });
    const { result, rerender } = renderHook(
      () => useAccountData("feed", accountUUID, { query: { limit: 10 }, maxAge: 0 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    rerender();
    expect(feed).toHaveBeenCalledTimes(1);
  });

  it("does not read again when a sync replaces the entry with an equal descriptor", async () => {
    const counter = jest.fn(async () => 1);
    const { store, wrapper } = setup({ counter });
    const { result } = renderHook(() => useAccountData("counter", accountUUID, { maxAge: 0 }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.pending).toBe(false));
    act(() => {
      store.dispatch(
        legacyAccountsSynced([
          { accountUUID, descriptor: { ...descriptor }, legacyId: AccountIdSchema.parse("js:0") },
        ]),
      );
    });
    expect(counter).toHaveBeenCalledTimes(1);
  });

  it("reads again when the account changes", async () => {
    const counter = jest.fn(async () => 1);
    const { wrapper } = setup({ counter });
    const { result, rerender } = renderHook(
      ({ account }: { account: AccountUUID }) => useAccountData("counter", account),
      { wrapper, initialProps: { account: uuidOf(0) } },
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    rerender({ account: uuidOf(1) });
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
        const data = useAccountData("counter", uuidOf(index));
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
    const { result } = renderHook(() => useAccountData("counter", accountUUID), { wrapper });
    await waitFor(() => expect(result.current.pending).toBe(false));
    await act(() => result.current.refresh());
    expect(counter).toHaveBeenCalledTimes(2);
  });

  it("exposes the error of the last read", async () => {
    const { wrapper } = setup({ counter: async () => Promise.reject(new RangeError("down")) });
    const { result } = renderHook(() => useAccountData("counter", accountUUID), { wrapper });
    await waitFor(() =>
      expect(result.current.error).toEqual({ name: "RangeError", message: "down" }),
    );
  });

  it("loads the next page while there is one", async () => {
    const feed = jest.fn(async (target: AccountTarget) =>
      target.cursor === "c1" ? { items: ["b"] } : { items: ["a"], nextCursor: "c1" },
    );
    const { store, wrapper } = setup({ feed });
    const { result } = renderHook(() => useAccountData("feed", accountUUID), { wrapper });
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    await act(() => result.current.loadMore());
    expect(selectFeed(store.getState(), accountUUID)).toEqual(["a", "b"]);
    expect(result.current.hasMore).toBe(false);
  });

  it("keeps two mounted queries of one account apart, each paging its own window", async () => {
    const feed = jest.fn(async (target: AccountTarget, query?: FeedQuery) => {
      const prefix = query?.filter ?? "all";
      return target.cursor === undefined
        ? { items: [`${prefix}-1`], nextCursor: `${prefix}-c1` }
        : { items: [`${prefix}-2`] };
    });
    const filtered = { filter: "usdt" };
    const { store, wrapper } = setup({ feed });
    const { result } = renderHook(
      () => ({
        all: useAccountData("feed", accountUUID),
        usdt: useAccountData("feed", accountUUID, { query: filtered }),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.usdt.hasMore).toBe(true));
    await waitFor(() => expect(result.current.all.hasMore).toBe(true));

    await act(() => result.current.usdt.loadMore());
    expect(selectFeed(store.getState(), accountUUID, filtered)).toEqual(["usdt-1", "usdt-2"]);
    expect(selectFeed(store.getState(), accountUUID)).toEqual(["all-1"]);
    expect(result.current.usdt.hasMore).toBe(false);
    expect(result.current.all.hasMore).toBe(true);
    expect(feed.mock.lastCall?.[0].cursor).toBe("usdt-c1");
  });
});

describe("useAccountData on an account discovery found", () => {
  const found = descriptorOf(9);
  const foundUUID = uuidOf(9);

  function setupDiscovered(read: AccountDataSource["read"]) {
    const store = makeStoreWithAccounts(
      [{ id: sourceIdOf("s"), supports: () => true, read }],
      undefined,
      [found],
    );
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    return { store, wrapper };
  }

  it("reads it before it is added, under the UUID it keeps", async () => {
    const counter = jest.fn(async (target: AccountTarget) => indexOf(target));
    const { store, wrapper } = setupDiscovered({ counter });
    const { result } = renderHook(() => useAccountData("counter", foundUUID), { wrapper });
    expect(result.current).toEqual(
      expect.objectContaining({ accountUUID: foundUUID, pending: true }),
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(store.getState().counter[foundUUID]).toBe(9);
    expect(counter.mock.lastCall?.[0].descriptor).toEqual(found);
  });

  it("takes the descriptor of the accounts slice first", async () => {
    const counter = jest.fn(async (target: AccountTarget) => indexOf(target));
    const { store, wrapper } = setupDiscovered({ counter });
    store.dispatch(
      discoveredAccountsRegistered([{ accountUUID: uuidOf(0), descriptor: descriptorOf(5) }]),
    );
    const { result } = renderHook(() => useAccountData("counter", uuidOf(0)), { wrapper });
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(counter.mock.lastCall?.[0].descriptor).toEqual(descriptorOf(0));
  });

  it("stops reading it once the register is cleared", async () => {
    const counter = jest.fn(async () => 1);
    const { store, wrapper } = setupDiscovered({ counter });
    const { result } = renderHook(() => useAccountData("counter", foundUUID), { wrapper });
    await waitFor(() => expect(result.current.pending).toBe(false));
    act(() => {
      store.dispatch(discoveredAccountsCleared());
    });
    expect(result.current.accountUUID).toBeUndefined();
    await act(() => result.current.refresh());
    expect(counter).toHaveBeenCalledTimes(1);
  });

  it("keeps its data and does not read again once it is added", async () => {
    const counter = jest.fn(async (target: AccountTarget) => indexOf(target));
    const { store, wrapper } = setupDiscovered({ counter });
    const { result } = renderHook(() => useAccountData("counter", foundUUID, { maxAge: 0 }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.pending).toBe(false));
    act(() => {
      store.dispatch(remoteAccountsAdded([{ accountUUID: foundUUID, descriptor: found }]));
    });
    expect(store.getState().discoveredAccounts).toEqual({});
    expect(result.current.accountUUID).toBe(foundUUID);
    expect(store.getState().counter[foundUUID]).toBe(9);
    expect(counter).toHaveBeenCalledTimes(1);
  });
});
