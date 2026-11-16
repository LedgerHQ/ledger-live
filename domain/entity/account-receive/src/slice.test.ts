import { AccountDataSourceIdSchema, accountDataReceived } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  initialAccountReceivesState,
  type AccountReceive,
  type AccountReceivesState,
} from "./schema";
import { mockAccountReceive } from "./schema.mock";
import { accountReceivesSlice } from "./slice";

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    staking: { query: undefined; result: { staked: string } };
  }
}

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const otherAccountUUID = computeAccountUUID(
  mockAddressAccountDescriptor({ key: "0x0000000000000000000000000000000000000001" }),
);
const sourceId = AccountDataSourceIdSchema.parse("s");
const fresh = mockAccountReceive({ address: "0x0000000000000000000000000000000000000002" });
const rotated = mockAccountReceive({ address: "0x0000000000000000000000000000000000000003" });

const reduce = (...actions: Parameters<typeof accountReceivesSlice.reducer>[1][]) =>
  actions.reduce<AccountReceivesState>(accountReceivesSlice.reducer, initialAccountReceivesState);

const receive = (data: AccountReceive, { uuid = accountUUID, revision = 0 } = {}) =>
  accountDataReceived({
    kind: "receive",
    accountUUID: uuid,
    queryKey: "",
    requestId: "r",
    data,
    sourceId,
    append: false,
    readAt: 0,
    revision,
  });

describe("accountReceivesSlice", () => {
  it("should store the receive of a read", () => {
    expect(reduce(receive(fresh))[accountUUID]).toEqual({ revision: 0, receive: fresh });
  });

  it("should replace the previous receive once the address rotates", () => {
    expect(reduce(receive(fresh), receive(rotated))[accountUUID]?.receive).toEqual(rotated);
  });

  it("should keep the newer receive when an older answer arrives", () => {
    const state = reduce(receive(rotated, { revision: 2 }), receive(fresh, { revision: 1 }));
    expect(state[accountUUID]).toEqual({ revision: 2, receive: rotated });
  });

  it("should leave the other account unchanged when one account is updated", () => {
    expect(
      reduce(receive(fresh, { uuid: otherAccountUUID }), receive(rotated))[otherAccountUUID]
        ?.receive,
    ).toEqual(fresh);
  });

  it("should keep the stored receive when another kind is received", () => {
    const state = reduce(
      receive(fresh),
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
    expect(state[accountUUID]?.receive).toEqual(fresh);
  });
});
