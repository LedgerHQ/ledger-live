import { AccountDataSourceIdSchema, accountDataReceived } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAccountAssetBalance } from "./schema.mock";
import { initialAccountBalancesState, type AccountBalancesState } from "./schema";
import { accountBalancesSlice } from "./slice";

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
const eth = mockAccountAssetBalance();
const usdt = mockAccountAssetBalance({
  assetId: "ethereum/erc20/usd-tether",
  balance: "5",
  spendableBalance: "5",
});

const reduce = (...actions: Parameters<typeof accountBalancesSlice.reducer>[1][]) =>
  actions.reduce<AccountBalancesState>(accountBalancesSlice.reducer, initialAccountBalancesState);

const receive = (data: (typeof eth)[], uuid = accountUUID) =>
  accountDataReceived({
    kind: "balance",
    accountUUID: uuid,
    queryKey: "",
    requestId: "r",
    data,
    sourceId,
    append: false,
    readAt: 0,
  });

describe("accountBalancesSlice", () => {
  it("should store the rows of a balance read", () => {
    expect(reduce(receive([eth, usdt]))[accountUUID]).toEqual([eth, usdt]);
  });

  it("should replace the previous rows when a new balance read arrives", () => {
    expect(reduce(receive([eth, usdt]), receive([eth]))[accountUUID]).toEqual([eth]);
  });

  it("should store an empty list when the read returns no rows", () => {
    expect(reduce(receive([eth, usdt]), receive([]))[accountUUID]).toEqual([]);
  });

  it("should leave the other account unchanged when one account is updated", () => {
    const state = reduce(receive([usdt], otherAccountUUID), receive([eth]));
    expect(state[otherAccountUUID]).toEqual([usdt]);
  });

  it("should keep the stored rows when another kind is received", () => {
    const state = reduce(
      receive([eth]),
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
    expect(state[accountUUID]).toEqual([eth]);
  });
});
