import { configureStore } from "@reduxjs/toolkit";
import { AccountIdSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import { accountOperationsSlice } from "@domain/entity-account-operations";
import { mockAccountOperation } from "@domain/entity-account-operations/schema.mock";
import { getAccountOperationsSources, registerAccountOperationsSources } from "./register";
import { fetchAccountOperations, fetchMoreAccountOperations } from "./operationsThunk";
import type { AccountOperationsPage, AccountOperationsSource } from "./operations";
import type { AccountRef } from "./source";

const accountId = AccountIdSchema.parse("js:2:ethereum:0xabc:");
const ref: AccountRef = {
  accountId,
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
};

const makeStore = () =>
  configureStore({ reducer: { accountOperations: accountOperationsSlice.reducer } });

const select = accountOperationsSlice.selectors;

const op = (id: string, date: string) =>
  mockAccountOperation({ id, date: DateTimeIsoSchema.parse(date) });

const head = [op("op-3", "2026-01-31T12:00:00.000Z"), op("op-2", "2026-01-30T12:00:00.000Z")];
const older = [op("op-1", "2026-01-29T12:00:00.000Z")];

/** A source that hands back a scripted sequence of pages, recording the queries it was given. */
const scripted = (pages: AccountOperationsPage[], over: Partial<AccountOperationsSource> = {}) => {
  const queries: { cursor?: string; limit?: number }[] = [];
  let call = 0;
  const source: AccountOperationsSource = {
    id: "granular",
    priority: 10,
    paginated: true,
    supports: () => true,
    getOperations: async (_ref, query) => {
      queries.push(query);
      return pages[Math.min(call++, pages.length - 1)];
    },
    ...over,
  };
  return { source, queries, calls: () => call };
};

describe("fetchAccountOperations", () => {
  afterEach(() => registerAccountOperationsSources([]));

  it("stores the head, the cursor and the answering source", async () => {
    const { source } = scripted([{ operations: head, nextCursor: "c1", complete: false }]);
    const store = makeStore();
    await store.dispatch(fetchAccountOperations(ref, { sources: [source] }));

    const state = store.getState();
    expect(select.selectAccountOperations(state, accountId).map(o => o.id)).toEqual([
      "op-3",
      "op-2",
    ]);
    expect(select.selectHasMoreAccountOperations(state, accountId)).toBe(true);
    expect(select.selectAccountOperationsStatus(state, accountId)).toEqual({
      pending: false,
      sourceId: "granular",
    });
  });

  it("reads the registered sources when none are passed", async () => {
    const { source } = scripted([{ operations: head, complete: true }]);
    registerAccountOperationsSources([source]);
    expect(getAccountOperationsSources()).toHaveLength(1);

    const store = makeStore();
    await store.dispatch(fetchAccountOperations(ref));
    expect(select.selectAccountOperationsStatus(store.getState(), accountId).sourceId).toBe(
      "granular",
    );
  });

  it("skips a head that is still fresh, and forces one on maxAge 0", async () => {
    const { source, calls } = scripted([{ operations: head, complete: true }]);
    const store = makeStore();
    await store.dispatch(fetchAccountOperations(ref, { sources: [source] }));
    await store.dispatch(fetchAccountOperations(ref, { sources: [source] }));
    expect(calls()).toBe(1);

    await store.dispatch(fetchAccountOperations(ref, { sources: [source], maxAge: 0 }));
    expect(calls()).toBe(2);
  });

  it("coalesces concurrent head reads into one", async () => {
    const { source, calls } = scripted([{ operations: head, complete: true }]);
    const store = makeStore();
    await Promise.all([
      store.dispatch(fetchAccountOperations(ref, { sources: [source] })),
      store.dispatch(fetchAccountOperations(ref, { sources: [source] })),
    ]);
    expect(calls()).toBe(1);
  });

  it("records a failure without dropping the window already loaded", async () => {
    const { source } = scripted([{ operations: head, nextCursor: "c1", complete: false }]);
    const store = makeStore();
    await store.dispatch(fetchAccountOperations(ref, { sources: [source] }));

    await store.dispatch(
      fetchAccountOperations(ref, {
        maxAge: 0,
        sources: [
          {
            ...source,
            getOperations: async () => {
              throw new Error("explorer down");
            },
          },
        ],
      }),
    );

    const state = store.getState();
    expect(select.selectAccountOperationsStatus(state, accountId).error).toBe("explorer down");
    expect(select.selectAccountOperations(state, accountId)).toHaveLength(2);
  });

  it("does nothing for a token-account ref", async () => {
    const { source, calls } = scripted([{ operations: head, complete: true }]);
    const store = makeStore();
    await store.dispatch(
      fetchAccountOperations(
        { ...ref, accountId: AccountIdSchema.parse(`${accountId}+token`), parentId: accountId },
        { sources: [source] },
      ),
    );
    expect(calls()).toBe(0);
  });

  it("runs without a store, over the reducer alone", async () => {
    const { source } = scripted([{ operations: head, complete: true }]);
    let state = {
      accountOperations: accountOperationsSlice.reducer(undefined, { type: "@@INIT" }),
    };
    const dispatch = (action: { type: string }) => {
      state = {
        accountOperations: accountOperationsSlice.reducer(state.accountOperations, action),
      };
    };

    await fetchAccountOperations(ref, { sources: [source] })(dispatch, () => state);
    expect(select.selectAccountOperations(state, accountId)).toHaveLength(2);
  });
});

describe("fetchMoreAccountOperations", () => {
  afterEach(() => registerAccountOperationsSources([]));

  const loadHead = async (store: ReturnType<typeof makeStore>, source: AccountOperationsSource) =>
    store.dispatch(fetchAccountOperations(ref, { sources: [source] }));

  it("resumes from the stored cursor and appends", async () => {
    const { source, queries } = scripted([
      { operations: head, nextCursor: "c1", complete: false },
      { operations: older, complete: true },
    ]);
    const store = makeStore();
    await loadHead(store, source);
    await store.dispatch(fetchMoreAccountOperations(ref, { sources: [source] }));

    expect(queries[1].cursor).toBe("c1");
    const state = store.getState();
    expect(select.selectAccountOperations(state, accountId).map(o => o.id)).toEqual([
      "op-3",
      "op-2",
      "op-1",
    ]);
    expect(select.selectHasMoreAccountOperations(state, accountId)).toBe(false);
  });

  it("is not blocked by freshness — a user reaching the bottom is always inside the window", async () => {
    const { source, calls } = scripted([
      { operations: head, nextCursor: "c1", complete: false },
      { operations: older, complete: true },
    ]);
    const store = makeStore();
    await loadHead(store, source);
    // A head read here would be skipped as fresh; loading more must not be.
    await store.dispatch(fetchMoreAccountOperations(ref, { sources: [source] }));
    expect(calls()).toBe(2);
  });

  it("does nothing when there is no cursor to resume from", async () => {
    const { source, calls } = scripted([{ operations: head, complete: true }]);
    const store = makeStore();
    await loadHead(store, source);
    await store.dispatch(fetchMoreAccountOperations(ref, { sources: [source] }));
    expect(calls()).toBe(1);
  });

  it("does nothing before anything has been read", async () => {
    const { source, calls } = scripted([{ operations: head, complete: true }]);
    const store = makeStore();
    await store.dispatch(fetchMoreAccountOperations(ref, { sources: [source] }));
    expect(calls()).toBe(0);
  });

  it("leaves the head's freshness stamp alone", async () => {
    const { source } = scripted([
      { operations: head, nextCursor: "c1", complete: false },
      { operations: older, complete: true },
    ]);
    const store = makeStore();
    await loadHead(store, source);
    const at = select.selectAccountOperationsAt(store.getState(), accountId);
    await store.dispatch(fetchMoreAccountOperations(ref, { sources: [source] }));
    expect(select.selectAccountOperationsAt(store.getState(), accountId)).toBe(at);
  });

  it("records a failure without dropping the window", async () => {
    const { source } = scripted([{ operations: head, nextCursor: "c1", complete: false }]);
    const store = makeStore();
    await loadHead(store, source);
    await store.dispatch(
      fetchMoreAccountOperations(ref, {
        sources: [
          {
            ...source,
            getOperations: async () => {
              throw new Error("cursor expired");
            },
          },
        ],
      }),
    );
    const state = store.getState();
    expect(select.selectAccountOperationsStatus(state, accountId).error).toBe("cursor expired");
    expect(select.selectAccountOperations(state, accountId)).toHaveLength(2);
  });
});
