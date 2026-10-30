import {
  AccountDataSourceIdSchema,
  accountDataQueryKey,
  accountDataReceived,
} from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAccountOperation } from "./schema.mock";
import {
  CountervalueTickerSchema,
  initialAccountOperationsState,
  type AccountOperation,
  type AccountOperationsQuery,
  type AccountOperationsState,
} from "./schema";
import { selectAccountOperation, selectAccountOperations } from "./selectors";
import { accountOperationsSlice } from "./slice";

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    staking: { query: undefined; result: { staked: string } };
  }
}

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const otherAccountUUID = computeAccountUUID(
  mockAddressAccountDescriptor({ address: "0x0000000000000000000000000000000000000001" }),
);

const sourceId = AccountDataSourceIdSchema.parse("s");
const op1 = mockAccountOperation({ id: "op-1" });
const op2 = mockAccountOperation({ id: "op-2" });
const op3 = mockAccountOperation({ id: "op-3" });
const usdtQuery: AccountOperationsQuery = { filterAsset: op2.assetId };

const reduce = (...actions: Parameters<typeof accountOperationsSlice.reducer>[1][]) =>
  actions.reduce<AccountOperationsState>(
    accountOperationsSlice.reducer,
    initialAccountOperationsState,
  );

const receive = (
  operations: AccountOperation[],
  {
    append = false,
    uuid = accountUUID,
    nextCursor,
    query,
    revision = 0,
  }: {
    append?: boolean;
    uuid?: typeof accountUUID;
    nextCursor?: string;
    query?: AccountOperationsQuery;
    revision?: number;
  } = {},
) =>
  accountDataReceived({
    kind: "operations",
    accountUUID: uuid,
    queryKey: accountDataQueryKey(query),
    requestId: "r",
    data: { operations, nextCursor },
    sourceId,
    append,
    readAt: 0,
    revision,
    nextCursor,
  });

const windowOf = (
  state: AccountOperationsState,
  query?: AccountOperationsQuery,
  uuid = accountUUID,
) => selectAccountOperations({ accountOperations: state }, uuid, query);

describe("accountOperationsSlice", () => {
  it("should store the first page", () => {
    expect(windowOf(reduce(receive([op1, op2], { nextCursor: "c1" })))).toEqual([op1, op2]);
  });

  it("should extend the window with each successive page", () => {
    const state = reduce(
      receive([op1], { nextCursor: "c1" }),
      receive([op2], { append: true, nextCursor: "c2" }),
      receive([op3], { append: true }),
    );
    expect(windowOf(state)).toEqual([op1, op2, op3]);
  });

  it("should not duplicate an operation a next page repeats", () => {
    const state = reduce(receive([op1, op2]), receive([op2, op3], { append: true }));
    expect(windowOf(state)).toEqual([op1, op2, op3]);
  });

  it("should keep one row when a page repeats an id", () => {
    expect(windowOf(reduce(receive([op1, op1])))).toEqual([op1]);
    const state = reduce(receive([op1]), receive([op2, op2], { append: true }));
    expect(windowOf(state)).toEqual([op1, op2]);
  });

  it("should replace the window when a head read arrives, dropping the rows no window lists", () => {
    const state = reduce(receive([op1, op2]), receive([op3]));
    expect(windowOf(state)).toEqual([op3]);
    expect(state[accountUUID]?.byId).toEqual({ [op3.id]: op3 });
  });

  it("should start the window from a next page when none is stored", () => {
    expect(windowOf(reduce(receive([op1], { append: true })))).toEqual([op1]);
  });

  it("should store an empty window when the read returns no operations", () => {
    expect(windowOf(reduce(receive([op1]), receive([])))).toEqual([]);
  });

  it("should keep a window per query, sharing the rows they both list", () => {
    const state = reduce(receive([op1, op2]), receive([op2], { query: usdtQuery }));
    expect(windowOf(state)).toEqual([op1, op2]);
    expect(windowOf(state, usdtQuery)).toEqual([op2]);
    expect(Object.keys(state[accountUUID]?.byId ?? {})).toEqual([op1.id, op2.id]);
  });

  it("should keep the rows another query still lists when a head read replaces its window", () => {
    const state = reduce(receive([op1, op2]), receive([op2], { query: usdtQuery }), receive([]));
    expect(windowOf(state)).toEqual([]);
    expect(windowOf(state, usdtQuery)).toEqual([op2]);
  });

  it("should keep the countervalues of a query in its own window only", () => {
    const usd = { countervalue: CountervalueTickerSchema.parse("USD") };
    const eur = { countervalue: CountervalueTickerSchema.parse("EUR") };
    const inUsd = mockAccountOperation({ id: "op-1", countervalues: { USD: "100" } });
    const inEur = mockAccountOperation({ id: "op-1", countervalues: { EUR: "90" } });
    const state = reduce(
      receive([inUsd], { query: usd }),
      receive([inEur], { query: eur }),
      receive([op1]),
    );
    expect(windowOf(state)).toEqual([op1]);
    expect(windowOf(state, usd)).toEqual([inUsd]);
    expect(windowOf(state, eur)).toEqual([inEur]);
    expect(selectAccountOperation({ accountOperations: state }, accountUUID, op1.id)).toEqual(op1);
  });

  it("should extend the countervalues of a window with its next page, and replace them on a head read", () => {
    const usd = { countervalue: CountervalueTickerSchema.parse("USD") };
    const op1InUsd = mockAccountOperation({ id: "op-1", countervalues: { USD: "100" } });
    const op2InUsd = mockAccountOperation({ id: "op-2", countervalues: { USD: "200" } });
    const paged = reduce(
      receive([op1InUsd], { query: usd }),
      receive([op2InUsd], { query: usd, append: true }),
    );
    expect(windowOf(paged, usd)).toEqual([op1InUsd, op2InUsd]);
    const reread = accountOperationsSlice.reducer(paged, receive([op1], { query: usd }));
    expect(windowOf(reread, usd)).toEqual([op1]);
  });

  it("should not let an older answer of another query overwrite a newer row", () => {
    const pending = mockAccountOperation({ id: "op-1", blockHeight: null });
    const confirmed = mockAccountOperation({ id: "op-1", blockHeight: 100 });
    const usd = { countervalue: CountervalueTickerSchema.parse("USD") };
    const state = reduce(
      receive([confirmed], { query: usd, revision: 2 }),
      receive([pending], { revision: 1 }),
    );
    expect(windowOf(state)).toEqual([confirmed]);
    expect(windowOf(state, usd)).toEqual([confirmed]);
  });

  it("should leave the other account unchanged when one account is updated", () => {
    const state = reduce(receive([op3], { uuid: otherAccountUUID }), receive([op1]));
    expect(windowOf(state, undefined, otherAccountUUID)).toEqual([op3]);
  });

  it("should keep the stored window when another kind is received", () => {
    const state = reduce(
      receive([op1]),
      accountDataReceived({
        kind: "staking",
        accountUUID,
        queryKey: "",
        requestId: "r",
        data: { staked: "1" },
        sourceId,
        append: false,
        readAt: 0,
        revision: 0,
      }),
    );
    expect(windowOf(state)).toEqual([op1]);
  });
});
