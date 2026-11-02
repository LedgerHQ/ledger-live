import { AccountDataSourceIdSchema, accountDataReceived } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAssetBalanceHistory } from "./schema.mock";
import {
  initialAccountBalanceHistoriesState,
  type AccountBalanceHistoriesState,
  type AssetBalanceHistory,
  type BalanceHistoryRange,
} from "./schema";
import accountBalanceHistoriesReducer from "./slice";

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
const eth = mockAssetBalanceHistory();
const usdt = mockAssetBalanceHistory({ assetId: "ethereum/erc20/usd-tether" });

const reduce = (...actions: Parameters<typeof accountBalanceHistoriesReducer>[1][]) =>
  actions.reduce<AccountBalanceHistoriesState>(
    accountBalanceHistoriesReducer,
    initialAccountBalanceHistoriesState,
  );

const receive = (range: BalanceHistoryRange, series: AssetBalanceHistory[], uuid = accountUUID) =>
  accountDataReceived({
    kind: "balanceHistory",
    accountUUID: uuid,
    requestId: "r",
    data: { range, series },
    sourceId,
    append: false,
    readAt: 0,
  });

describe("accountBalanceHistoriesSlice", () => {
  it("should start from the initial state", () => {
    expect(accountBalanceHistoriesReducer(undefined, { type: "" })).toEqual(
      initialAccountBalanceHistoriesState,
    );
  });

  it("should store the series under the range they were read for", () => {
    expect(reduce(receive("week", [eth, usdt]))[accountUUID]).toEqual({ week: [eth, usdt] });
  });

  it("should keep the series of the other ranges", () => {
    const state = reduce(receive("week", [eth]), receive("year", [usdt]));
    expect(state[accountUUID]).toEqual({ week: [eth], year: [usdt] });
  });

  it("should replace the series of a range read again", () => {
    expect(reduce(receive("week", [eth, usdt]), receive("week", [eth]))[accountUUID]).toEqual({
      week: [eth],
    });
  });

  it("should store an empty list when the read returns no series", () => {
    expect(reduce(receive("week", [eth]), receive("week", []))[accountUUID]).toEqual({ week: [] });
  });

  it("should leave the other account unchanged when one account is updated", () => {
    const state = reduce(receive("week", [usdt], otherAccountUUID), receive("week", [eth]));
    expect(state[otherAccountUUID]).toEqual({ week: [usdt] });
  });

  it("should keep the stored series when another kind is received", () => {
    const state = reduce(
      receive("week", [eth]),
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
    expect(state[accountUUID]).toEqual({ week: [eth] });
  });
});
