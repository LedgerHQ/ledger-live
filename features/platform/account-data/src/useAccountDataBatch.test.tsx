import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  fetchMoreAccountData,
  type AccountDataSource,
  type AccountTarget,
} from "@domain/api-account-data";
import {
  type FeedPage,
  type FeedQuery,
  descriptorOf,
  indexOf,
  makeStore,
  sourceIdOf,
} from "@domain/api-account-data/testing";
import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { useAccountDataBatch } from "./useAccountDataBatch";

function setup(source: Omit<AccountDataSource, "id" | "supports">) {
  const store = makeStore([{ id: sourceIdOf("s"), supports: () => true, ...source }]);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, wrapper };
}

const accounts = [descriptorOf(0), descriptorOf(1), descriptorOf(2)];
const uuids = accounts.map(computeAccountUUID);

const settled = (targets: readonly AccountTarget[]) =>
  targets.map(target => ({ status: "fulfilled" as const, value: indexOf(target) }));

describe("useAccountDataBatch", () => {
  it("reads every account in one batch call of the source", async () => {
    const counter = jest.fn(async (targets: readonly AccountTarget[]) => settled(targets));
    const { store, wrapper } = setup({ readBatch: { counter } });
    const { result } = renderHook(() => useAccountDataBatch("counter", accounts), { wrapper });
    expect(result.current.pending).toBe(true);
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(counter).toHaveBeenCalledTimes(1);
    expect(counter.mock.calls[0][0]).toHaveLength(3);
    expect(uuids.map(uuid => store.getState().counter[uuid])).toEqual([0, 1, 2]);
  });

  it("exposes the UUIDs in the order of the descriptors", async () => {
    const { wrapper } = setup({ read: { counter: async target => indexOf(target) } });
    const { result } = renderHook(() => useAccountDataBatch("counter", accounts), { wrapper });
    expect(result.current.accountUUIDs).toEqual(uuids);
    await waitFor(() => expect(result.current.pending).toBe(false));
  });

  it("does nothing without accounts", () => {
    const counter = jest.fn(async () => 1);
    const { wrapper } = setup({ read: { counter } });
    const { result } = renderHook(() => useAccountDataBatch("counter", []), { wrapper });
    expect(result.current).toEqual(
      expect.objectContaining({ accountUUIDs: [], pending: false, errors: [] }),
    );
    expect(counter).not.toHaveBeenCalled();
  });

  it("does not read again on a re-render with equal descriptors in a new array", async () => {
    const counter = jest.fn(async (target: AccountTarget) => indexOf(target));
    const { wrapper } = setup({ read: { counter } });
    const { result, rerender } = renderHook(
      () =>
        useAccountDataBatch(
          "counter",
          accounts.map(d => ({ ...d })),
          { maxAge: 0 },
        ),
      { wrapper },
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    rerender();
    expect(counter).toHaveBeenCalledTimes(3);
  });

  it("reads the added account when the list changes", async () => {
    const counter = jest.fn(async (target: AccountTarget) => indexOf(target));
    const { wrapper } = setup({ read: { counter } });
    const { result, rerender } = renderHook(
      ({ list }: { list: AccountDescriptor[] }) => useAccountDataBatch("counter", list),
      { wrapper, initialProps: { list: accounts.slice(0, 2) } },
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    rerender({ list: accounts });
    await waitFor(() => expect(counter).toHaveBeenCalledTimes(3));
    expect(counter.mock.lastCall?.[0].descriptor).toEqual(accounts[2]);
  });

  it("reads only the new account when one is added, even with no freshness", async () => {
    const counter = jest.fn(async (target: AccountTarget) => indexOf(target));
    const { wrapper } = setup({ read: { counter } });
    const { result, rerender } = renderHook(
      ({ list }: { list: AccountDescriptor[] }) =>
        useAccountDataBatch("counter", list, { maxAge: 0 }),
      { wrapper, initialProps: { list: accounts.slice(0, 2) } },
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    rerender({ list: accounts });
    await waitFor(() => expect(counter).toHaveBeenCalledTimes(3));
    rerender({ list: [accounts[2], accounts[1], accounts[0]] });
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(counter).toHaveBeenCalledTimes(3);
  });

  it("drops a removed account, and reads it again once added back", async () => {
    const counter = jest.fn(async (target: AccountTarget) => indexOf(target));
    const { wrapper } = setup({ read: { counter } });
    const { result, rerender } = renderHook(
      ({ list }: { list: AccountDescriptor[] }) =>
        useAccountDataBatch("counter", list, { maxAge: 0 }),
      { wrapper, initialProps: { list: accounts } },
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(counter).toHaveBeenCalledTimes(3);

    rerender({ list: accounts.slice(0, 2) });
    expect(result.current.accountUUIDs).toEqual(uuids.slice(0, 2));
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(counter).toHaveBeenCalledTimes(3);

    rerender({ list: accounts });
    await waitFor(() => expect(counter).toHaveBeenCalledTimes(4));
    expect(counter.mock.lastCall?.[0].descriptor).toEqual(accounts[2]);
  });

  it("reads and lists a duplicated account once", async () => {
    const counter = jest.fn(async (target: AccountTarget) => indexOf(target));
    const { wrapper } = setup({ read: { counter } });
    const list = [accounts[0], { ...accounts[0] }, accounts[1]];
    const { result } = renderHook(() => useAccountDataBatch("counter", list), { wrapper });
    expect(result.current.accountUUIDs).toEqual(uuids.slice(0, 2));
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(counter).toHaveBeenCalledTimes(2);
  });

  it("reads and reports under the query it was given", async () => {
    const feed = jest.fn(async (_target: AccountTarget, query?: FeedQuery) =>
      query?.filter === "usdt" ? Promise.reject(new RangeError("down")) : { items: ["a"] },
    );
    const { wrapper } = setup({ read: { feed } });
    const { result } = renderHook(
      () => ({
        all: useAccountDataBatch("feed", accounts.slice(0, 1)),
        usdt: useAccountDataBatch("feed", accounts.slice(0, 1), { query: { filter: "usdt" } }),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.usdt.errors).toHaveLength(1));
    await waitFor(() => expect(result.current.all.pending).toBe(false));
    expect(result.current.all.errors).toEqual([]);
    expect(feed.mock.calls.map(([, query]) => query)).toEqual([undefined, { filter: "usdt" }]);
  });

  it("clears an account's error once a refresh succeeds", async () => {
    let fail = true;
    const { wrapper } = setup({
      read: {
        counter: async target => (fail ? Promise.reject(new RangeError("down")) : indexOf(target)),
      },
    });
    const { result } = renderHook(() => useAccountDataBatch("counter", accounts.slice(0, 1)), {
      wrapper,
    });
    await waitFor(() => expect(result.current.errors).toHaveLength(1));
    fail = false;
    await act(() => result.current.refresh());
    expect(result.current.errors).toEqual([]);
  });

  it("reads every account into a store that replaces the mounted one", async () => {
    const counter = jest.fn(async (target: AccountTarget) => indexOf(target));
    const source = { id: sourceIdOf("s"), supports: () => true, read: { counter } };
    const first = makeStore([source]);
    const second = makeStore([source]);
    let store = first;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result, rerender } = renderHook(() => useAccountDataBatch("counter", accounts), {
      wrapper,
    });
    await waitFor(() => expect(result.current.pending).toBe(false));
    store = second;
    rerender();
    await waitFor(() => expect(counter).toHaveBeenCalledTimes(6));
    await waitFor(() =>
      expect(uuids.map(uuid => second.getState().counter[uuid])).toEqual([0, 1, 2]),
    );
  });

  it("is pending on head reads only, not while a next page loads elsewhere", async () => {
    const deferred: { resolve: (page: FeedPage) => void }[] = [];
    const later = () => new Promise<FeedPage>(resolve => deferred.push({ resolve }));
    let heads = 0;
    const feed = jest.fn(async (target: AccountTarget) => {
      if (target.cursor) return later();
      heads += 1;
      return heads === 1 ? { items: ["a"], nextCursor: "c1" } : later();
    });
    const { store, wrapper } = setup({ read: { feed } });
    const list = accounts.slice(0, 1);
    const { result } = renderHook(() => useAccountDataBatch("feed", list), { wrapper });
    await waitFor(() => expect(result.current.pending).toBe(false));

    let more: Promise<void> = Promise.resolve();
    act(() => {
      more = store.dispatch(fetchMoreAccountData("feed", list[0]));
    });
    await waitFor(() => expect(deferred).toHaveLength(1));
    expect(result.current.pending).toBe(false);
    await act(async () => {
      deferred[0].resolve({ items: ["b"] });
      await more;
    });

    let refreshed: Promise<void> = Promise.resolve();
    act(() => {
      refreshed = result.current.refresh();
    });
    await waitFor(() => expect(result.current.pending).toBe(true));
    await act(async () => {
      deferred[1].resolve({ items: ["a"] });
      await refreshed;
    });
    expect(result.current.pending).toBe(false);
  });

  it("reports the failed accounts only", async () => {
    const { wrapper } = setup({
      read: {
        counter: async target =>
          indexOf(target) === 1 ? Promise.reject(new RangeError("down")) : indexOf(target),
      },
    });
    const { result } = renderHook(() => useAccountDataBatch("counter", accounts), { wrapper });
    await waitFor(() =>
      expect(result.current.errors).toEqual([
        { accountUUID: uuids[1], error: { name: "RangeError", message: "down" } },
      ]),
    );
  });

  it("refreshes every account whatever the freshness", async () => {
    const counter = jest.fn(async (targets: readonly AccountTarget[]) => settled(targets));
    const { wrapper } = setup({ readBatch: { counter } });
    const { result } = renderHook(() => useAccountDataBatch("counter", accounts), { wrapper });
    await waitFor(() => expect(result.current.pending).toBe(false));
    await act(() => result.current.refresh());
    expect(counter).toHaveBeenCalledTimes(2);
    expect(counter.mock.lastCall?.[0]).toHaveLength(3);
  });
});
