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
  mockAddressAccountDescriptor({ address: "0x0000000000000000000000000000000000000001" }),
);
const sourceId = AccountDataSourceIdSchema.parse("s");
const onboarding: AccountReceive = { status: "onboardingRequired" };
const ready = mockAccountReceive({ address: "ldg::1220ab" });

const reduce = (...actions: Parameters<typeof accountReceivesSlice.reducer>[1][]) =>
  actions.reduce<AccountReceivesState>(accountReceivesSlice.reducer, initialAccountReceivesState);

const receive = (data: AccountReceive, uuid = accountUUID) =>
  accountDataReceived({
    kind: "receive",
    accountUUID: uuid,
    queryKey: "",
    requestId: "r",
    data,
    sourceId,
    append: false,
    readAt: 0,
    revision: 0,
  });

describe("accountReceivesSlice", () => {
  it("should store the receive of a read", () => {
    expect(reduce(receive(ready))[accountUUID]).toEqual(ready);
  });

  it("should replace the previous receive once the account is onboarded", () => {
    expect(reduce(receive(onboarding), receive(ready))[accountUUID]).toEqual(ready);
  });

  it("should leave the other account unchanged when one account is updated", () => {
    expect(reduce(receive(onboarding, otherAccountUUID), receive(ready))[otherAccountUUID]).toEqual(
      onboarding,
    );
  });

  it("should keep the stored receive when another kind is received", () => {
    const state = reduce(
      receive(ready),
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
    expect(state[accountUUID]).toEqual(ready);
  });
});
