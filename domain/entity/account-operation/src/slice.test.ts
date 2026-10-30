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
  }: {
    append?: boolean;
    uuid?: typeof accountUUID;
    nextCursor?: string;
    query?: AccountOperationsQuery;
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

  it("should keep the countervalues of each fiat a query asked for", () => {
    const inUsd = mockAccountOperation({ id: "op-1", countervalues: { USD: "100" } });
    const inEur = mockAccountOperation({ id: "op-1", countervalues: { EUR: "90" } });
    const eur = { countervalue: CountervalueTickerSchema.parse("EUR") };
    const state = reduce(receive([inUsd]), receive([inEur], { query: eur }));
    expect(selectAccountOperation({ accountOperations: state }, accountUUID, op1.id)).toEqual({
      ...op1,
      countervalues: { USD: "100", EUR: "90" },
    });
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
      }),
    );
    expect(windowOf(state)).toEqual([op1]);
  });
});
