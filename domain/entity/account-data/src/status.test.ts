import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { AccountDataSourceIdSchema } from "./sourceId";
import {
  accountDataFailed,
  accountDataReceived,
  accountDataRequested,
  accountDataSlice,
  isAccountDataReceived,
  selectAccountDataStatus,
  type AccountDataState,
} from "./status";

declare module "./registry" {
  interface AccountDataRegistry {
    pages: { query: { limit: number }; result: { items: string[]; nextCursor?: string } };
    total: { query: undefined; result: number };
  }
}

const uuid = computeAccountUUID({
  purpose: "account",
  version: "2",
  type: "address",
  network: "ethereum",
  address: "0x0",
  path: "m/44h/60h/0h/0/0",
});

const sourceId = AccountDataSourceIdSchema.parse("s");

const reduce = (...actions: Parameters<typeof accountDataSlice.reducer>[1][]) =>
  actions.reduce<AccountDataState>(accountDataSlice.reducer, {});

const status = (state: AccountDataState, query: { limit: number } = { limit: 1 }) =>
  selectAccountDataStatus({ accountData: state }, "pages", uuid, query);

const requested = (requestId: string, append = false, queryKey = '{"limit":1}') =>
  accountDataRequested({ kind: "pages", accountUUID: uuid, requestId, queryKey, append });

const received = (requestId: string, append = false, nextCursor?: string) =>
  accountDataReceived({
    kind: "pages",
    accountUUID: uuid,
    queryKey: '{"limit":1}',
    requestId,
    data: { items: ["a"], nextCursor },
    sourceId,
    append,
    readAt: 1000,
    nextCursor,
  });

describe("accountDataSlice", () => {
  it("records the read in flight, then what the head answer was read from", () => {
    expect(status(reduce(requested("r1")))?.request).toEqual({ id: "r1", append: false });
    expect(status(reduce(requested("r1"), received("r1", false, "c1")))).toEqual({
      sourceId,
      readAt: 1000,
      nextCursor: "c1",
    });
  });

  it("keeps the head's query and time on a next page, and moves the cursor", () => {
    const state = reduce(
      requested("r1"),
      received("r1", false, "c1"),
      requested("r2", true, '{"limit":1}'),
      { ...received("r2", true), payload: { ...received("r2", true).payload, readAt: 2000 } },
    );
    expect(status(state)).toEqual({ sourceId: "s", readAt: 1000 });
  });

  it("keeps the stored data's time and cursor on a failure", () => {
    const state = reduce(
      requested("r1"),
      received("r1", false, "c1"),
      requested("r2"),
      accountDataFailed({
        kind: "pages",
        accountUUID: uuid,
        queryKey: '{"limit":1}',
        requestId: "r2",
        error: { name: "Error", message: "down" },
      }),
    );
    expect(status(state)).toEqual({
      sourceId,
      readAt: 1000,
      nextCursor: "c1",
      error: { name: "Error", message: "down" },
    });
  });

  it("clears the last error when a new read starts", () => {
    const state = reduce(
      requested("r1"),
      accountDataFailed({
        kind: "pages",
        accountUUID: uuid,
        queryKey: '{"limit":1}',
        requestId: "r1",
        error: { name: "Error", message: "down" },
      }),
      requested("r2"),
    );
    expect(status(state)?.error).toBeUndefined();
  });

  it("ignores an answer or a failure of a read that is no longer the latest", () => {
    const state = reduce(
      requested("r1"),
      requested("r2"),
      received("r1"),
      accountDataFailed({
        kind: "pages",
        accountUUID: uuid,
        queryKey: '{"limit":1}',
        requestId: "r1",
        error: { name: "Error", message: "late" },
      }),
    );
    expect(status(state)).toEqual({ request: { id: "r2", append: false } });
  });

  it("keeps the reads of each query apart", () => {
    const state = reduce(
      requested("r1"),
      requested("r2", false, '{"limit":2}'),
      received("r1", false, "c1"),
    );
    expect(status(state)).toEqual({ sourceId, readAt: 1000, nextCursor: "c1" });
    expect(status(state, { limit: 2 })?.request).toEqual({ id: "r2", append: false });
  });

  it("keeps kinds apart", () => {
    const accountData = reduce(requested("r1"));
    expect(selectAccountDataStatus({ accountData }, "total", uuid)).toBeUndefined();
  });
});

describe("isAccountDataReceived", () => {
  it("matches the answers of its kind only", () => {
    const total = accountDataReceived({
      kind: "total",
      accountUUID: uuid,
      queryKey: "",
      requestId: "r",
      data: 3,
      sourceId,
      append: false,
      readAt: 0,
    });
    expect(isAccountDataReceived("total")(total)).toBe(true);
    expect(isAccountDataReceived("pages")(total)).toBe(false);
    expect(isAccountDataReceived("total")(requested("r"))).toBe(false);
  });
});
