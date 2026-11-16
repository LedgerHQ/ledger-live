import { AccountDataSourceIdSchema, accountDataReceived } from "@domain/entity-account-data";
import { computeAccountUUID, type AccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { initialAccountTronState, type AccountTronState, type TronResources } from "./schema";
import { mockTronResources } from "./schema.mock";
import { mockAccountTronState } from "./slice.mock";
import reducer, {
  accountTronSlice,
  selectTronAvailableBandwidth,
  selectTronResources,
} from "./slice";

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    "test:other": { query: undefined; result: TronResources };
  }
}

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const otherAccountUUID = computeAccountUUID(
  mockAddressAccountDescriptor({ key: "0x0000000000000000000000000000000000000001" }),
);
const sourceId = AccountDataSourceIdSchema.parse("s");
const common = { queryKey: "", requestId: "r", sourceId, append: false, readAt: 0 };

const read = (
  resources: TronResources,
  { uuid = accountUUID, revision = 0 }: { uuid?: AccountUUID; revision?: number } = {},
) =>
  accountDataReceived({
    ...common,
    kind: "tron:resources",
    accountUUID: uuid,
    data: resources,
    revision,
  });

const reduce = (...actions: Parameters<typeof accountTronSlice.reducer>[1][]) =>
  actions.reduce<AccountTronState>(accountTronSlice.reducer, initialAccountTronState);

const root = (state: AccountTronState) => ({ [accountTronSlice.name]: state });

describe("accountTronSlice", () => {
  it("should start from the initial state", () => {
    expect(reducer(undefined, { type: "" })).toEqual(initialAccountTronState);
  });

  it("should store the resources of the account read", () => {
    const resources = mockTronResources();
    expect(reduce(read(resources))).toEqual({ [accountUUID]: { revision: 0, resources } });
  });

  it("should replace the resources with a newer read", () => {
    const newer = mockTronResources({ energy: "7" });
    expect(reduce(read(mockTronResources()), read(newer, { revision: 1 }))[accountUUID]).toEqual({
      revision: 1,
      resources: newer,
    });
  });

  it("should keep the newer resources when an older read answers last", () => {
    const newer = mockTronResources({ energy: "7" });
    expect(
      reduce(read(newer, { revision: 2 }), read(mockTronResources(), { revision: 1 }))[accountUUID],
    ).toEqual({ revision: 2, resources: newer });
  });

  it("should keep each account apart", () => {
    const other = mockTronResources({ tronPower: 0 });
    const state = reduce(read(mockTronResources()), read(other, { uuid: otherAccountUUID }));
    expect(state[otherAccountUUID]?.resources).toEqual(other);
    expect(state[accountUUID]?.resources).toEqual(mockTronResources());
  });

  it("should ignore another kind", () => {
    const action = accountDataReceived({
      ...common,
      kind: "test:other",
      accountUUID,
      data: mockTronResources(),
      revision: 0,
    });
    expect(reduce(action)).toEqual(initialAccountTronState);
  });

  it.each(["__proto__", "constructor", "toString"])(
    "should skip an answer keyed by the inherited key %s",
    key => {
      const state = reducer(initialAccountTronState, {
        type: "accountData/received",
        payload: {
          ...common,
          kind: "tron:resources",
          accountUUID: key,
          data: mockTronResources(),
          revision: 0,
        },
      });
      expect(state).toEqual({});
    },
  );
});

describe("selectors", () => {
  const state = mockAccountTronState();

  it("should select the resources of a read account", () => {
    expect(selectTronResources(root(state), accountUUID)).toEqual(mockTronResources());
  });

  it("should select nothing for an account not read", () => {
    expect(selectTronResources(root(state), otherAccountUUID)).toBeUndefined();
    expect(selectTronAvailableBandwidth(root(state), otherAccountUUID)).toBeUndefined();
  });

  it("should select the bandwidth left, free and gained", () => {
    const resources = mockTronResources({
      bandwidth: { freeUsed: "100", freeLimit: "600", gainedUsed: "30", gainedLimit: "200" },
    });
    expect(
      selectTronAvailableBandwidth(
        root(mockAccountTronState({ [accountUUID]: { revision: 0, resources } })),
        accountUUID,
      ),
    ).toBe("670");
  });
});
