import { AccountDataSourceIdSchema, accountDataReceived } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  initialAccountAddressesState,
  type AccountAddress,
  type AccountAddressesState,
} from "./schema";
import { mockAccountAddress } from "./schema.mock";
import { accountAddressesSlice } from "./slice";

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
const first = mockAccountAddress({ freshAddress: "bc1qfirst" });
const next = mockAccountAddress({ freshAddress: "bc1qnext" });

const reduce = (...actions: Parameters<typeof accountAddressesSlice.reducer>[1][]) =>
  actions.reduce<AccountAddressesState>(
    accountAddressesSlice.reducer,
    initialAccountAddressesState,
  );

const receive = (data: AccountAddress, uuid = accountUUID) =>
  accountDataReceived({
    kind: "address",
    accountUUID: uuid,
    queryKey: "",
    requestId: "r",
    data,
    sourceId,
    append: false,
    readAt: 0,
    revision: 0,
  });

describe("accountAddressesSlice", () => {
  it("should store the address of an address read", () => {
    expect(reduce(receive(first))[accountUUID]).toEqual(first);
  });

  it("should replace the previous address when a new read arrives", () => {
    expect(reduce(receive(first), receive(next))[accountUUID]).toEqual(next);
  });

  it("should leave the other account unchanged when one account is updated", () => {
    expect(reduce(receive(next, otherAccountUUID), receive(first))[otherAccountUUID]).toEqual(next);
  });

  it("should keep the stored address when another kind is received", () => {
    const state = reduce(
      receive(first),
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
    expect(state[accountUUID]).toEqual(first);
  });
});
