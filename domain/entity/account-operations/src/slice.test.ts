import { AccountDataSourceIdSchema, accountDataReceived } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAccountOperation } from "./schema.mock";
import { initialAccountOperationsState, type AccountOperationsState } from "./schema";
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

const reduce = (...actions: Parameters<typeof accountOperationsSlice.reducer>[1][]) =>
  actions.reduce<AccountOperationsState>(
    accountOperationsSlice.reducer,
    initialAccountOperationsState,
  );

const receive = (
  operations: (typeof op1)[],
  {
    append = false,
    uuid = accountUUID,
    nextCursor,
  }: { append?: boolean; uuid?: typeof accountUUID; nextCursor?: string } = {},
) =>
  accountDataReceived({
    kind: "operations",
    accountUUID: uuid,
    requestId: "r",
    data: { operations, nextCursor },
    sourceId,
    append,
    readAt: 0,
    nextCursor,
  });

describe("accountOperationsSlice", () => {
  it("should store the first page", () => {
    expect(reduce(receive([op1, op2], { nextCursor: "c1" }))[accountUUID]).toEqual([op1, op2]);
  });

  it("should extend the window with each successive page", () => {
    const state = reduce(
      receive([op1], { nextCursor: "c1" }),
      receive([op2], { append: true, nextCursor: "c2" }),
      receive([op3], { append: true }),
    );
    expect(state[accountUUID]).toEqual([op1, op2, op3]);
  });

  it("should not duplicate an operation a next page repeats", () => {
    const state = reduce(receive([op1, op2]), receive([op2, op3], { append: true }));
    expect(state[accountUUID]).toEqual([op1, op2, op3]);
  });

  it("should replace the window when a head read arrives", () => {
    const state = reduce(receive([op1, op2]), receive([op3]));
    expect(state[accountUUID]).toEqual([op3]);
  });

  it("should start the window from a next page when none is stored", () => {
    expect(reduce(receive([op1], { append: true }))[accountUUID]).toEqual([op1]);
  });

  it("should store an empty window when the read returns no operations", () => {
    expect(reduce(receive([op1]), receive([]))[accountUUID]).toEqual([]);
  });

  it("should leave the other account unchanged when one account is updated", () => {
    const state = reduce(receive([op3], { uuid: otherAccountUUID }), receive([op1]));
    expect(state[otherAccountUUID]).toEqual([op3]);
  });

  it("should keep the stored window when another kind is received", () => {
    const state = reduce(
      receive([op1]),
      accountDataReceived({
        kind: "staking",
        accountUUID,
        requestId: "r",
        data: { staked: "1" },
        sourceId,
        append: false,
        readAt: 0,
      }),
    );
    expect(state[accountUUID]).toEqual([op1]);
  });
});
