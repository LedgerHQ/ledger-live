import { configureStore } from "@reduxjs/toolkit";
import {
  AccountDataSourceIdSchema,
  accountDataReceived,
  accountDataRequested,
  accountDataSlice,
} from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  AccountOperationSchema,
  type AccountOperation,
  type AccountOperationsPage,
} from "./schema";
import {
  accountOperationsRemoved,
  accountOperationsSlice,
  selectAccountOperations,
  selectAccountOperationsTotal,
} from "./slice";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());

const operation = (id: string, date: string): AccountOperation =>
  AccountOperationSchema.parse({
    id,
    assetId: "ethereum",
    hash: `0x${id}`,
    type: "IN",
    value: "1",
    fee: "0",
    senders: [],
    recipients: [],
    blockHeight: 1,
    date,
  });

function makeStore() {
  return configureStore({
    reducer: {
      accountData: accountDataSlice.reducer,
      accountOperations: accountOperationsSlice.reducer,
    },
  });
}

let requests = 0;

function receive(store: ReturnType<typeof makeStore>, data: AccountOperationsPage, append = false) {
  const requestId = `r${++requests}`;
  store.dispatch(
    accountDataRequested({ kind: "operations", accountUUID, requestId, queryKey: "", append }),
  );
  store.dispatch(
    accountDataReceived({
      kind: "operations",
      accountUUID,
      requestId,
      data,
      sourceId: AccountDataSourceIdSchema.parse("s"),
      append,
      readAt: 0,
    }),
  );
}

const ids = (store: ReturnType<typeof makeStore>) =>
  selectAccountOperations(store.getState(), accountUUID).map(each => each.id);

describe("accountOperationsSlice", () => {
  it("replaces the stored operations on a head read", () => {
    const store = makeStore();
    receive(store, { operations: [operation("a", "2026-01-02T00:00:00Z")] });
    receive(store, { operations: [operation("b", "2026-01-03T00:00:00Z")], total: 9 });
    expect(ids(store)).toEqual(["b"]);
    expect(selectAccountOperationsTotal(store.getState(), accountUUID)).toBe(9);
  });

  it("merges a next page, newest first, keeping the stored copy of a repeated row", () => {
    const store = makeStore();
    receive(store, {
      operations: [operation("b", "2026-01-03T00:00:00Z"), operation("a", "2026-01-02T00:00:00Z")],
    });
    receive(
      store,
      {
        operations: [
          operation("a", "2026-01-02T00:00:00Z"),
          operation("z", "2026-01-01T00:00:00Z"),
        ],
      },
      true,
    );
    expect(ids(store)).toEqual(["b", "a", "z"]);
  });

  it("keeps the known total when a next page does not carry one", () => {
    const store = makeStore();
    receive(store, { operations: [operation("b", "2026-01-03T00:00:00Z")], total: 9 });
    receive(store, { operations: [operation("a", "2026-01-02T00:00:00Z")] }, true);
    expect(selectAccountOperationsTotal(store.getState(), accountUUID)).toBe(9);
  });

  it("sorts by instant, whatever the offset", () => {
    const store = makeStore();
    receive(store, {
      operations: [
        operation("utc", "2026-01-31T07:00:00Z"),
        operation("ist", "2026-01-31T12:00:00+05:30"),
      ],
    });
    expect(ids(store)).toEqual(["utc", "ist"]);
  });

  it("forgets removed accounts", () => {
    const store = makeStore();
    receive(store, { operations: [operation("a", "2026-01-02T00:00:00Z")] });
    store.dispatch(accountOperationsRemoved([accountUUID]));
    expect(ids(store)).toEqual([]);
  });
});
