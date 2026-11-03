import {
  AccountDataSourceIdSchema,
  accountDataQueryKey,
  accountDataReceived,
} from "@domain/entity-account-data";
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

const at0 = (series: AssetBalanceHistory[]) => ({ revision: 0, series });

const receive = (
  range: BalanceHistoryRange,
  series: AssetBalanceHistory[],
  uuid = accountUUID,
  revision = 0,
) =>
  accountDataReceived({
    kind: "balanceHistory",
    accountUUID: uuid,
    queryKey: accountDataQueryKey({ range }),
    requestId: "r",
    data: { range, series },
    sourceId,
    append: false,
    readAt: 0,
    revision,
  });

const valued = (usd: string, balance = "5") =>
  mockAssetBalanceHistory({
    points: [{ date: "2026-01-01T00:00:00.000Z", balance, countervalues: { USD: usd } }],
  });
const plain = (balance = "5") =>
  mockAssetBalanceHistory({ points: [{ date: "2026-01-01T00:00:00.000Z", balance }] });
const pointOf = (state: AccountBalanceHistoriesState) =>
  state[accountUUID]?.week?.series[0]?.points[0];

describe("accountBalanceHistoriesSlice", () => {
  it("should start from the initial state", () => {
    expect(accountBalanceHistoriesReducer(undefined, { type: "" })).toEqual(
      initialAccountBalanceHistoriesState,
    );
  });

  it("should store the series under the range they were read for", () => {
    expect(reduce(receive("week", [eth, usdt]))[accountUUID]).toEqual({ week: at0([eth, usdt]) });
  });

  it("should keep the series of the other ranges", () => {
    const state = reduce(receive("week", [eth]), receive("year", [usdt]));
    expect(state[accountUUID]).toEqual({ week: at0([eth]), year: at0([usdt]) });
  });

  it("should replace the series of a range read again", () => {
    expect(reduce(receive("week", [eth, usdt]), receive("week", [eth]))[accountUUID]).toEqual({
      week: at0([eth]),
    });
  });

  it("should keep the newer series when an older answer of another query reads the same range", () => {
    const state = reduce(
      receive("month", [eth, usdt], accountUUID, 2),
      receive("month", [eth], accountUUID, 1),
    );
    expect(state[accountUUID]).toEqual({ month: { revision: 2, series: [eth, usdt] } });
  });

  it("should store an empty list when the read returns no series", () => {
    expect(reduce(receive("week", [eth]), receive("week", []))[accountUUID]).toEqual({
      week: at0([]),
    });
  });

  it("should leave the other account unchanged when one account is updated", () => {
    const state = reduce(receive("week", [usdt], otherAccountUUID), receive("week", [eth]));
    expect(state[otherAccountUUID]).toEqual({ week: at0([usdt]) });
  });

  it("should keep the stored series when another kind is received", () => {
    const state = reduce(
      receive("week", [eth]),
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
    expect(state[accountUUID]).toEqual({ week: at0([eth]) });
  });

  describe("countervalues", () => {
    it("stores the countervalues a read returned with its points", () => {
      expect(pointOf(reduce(receive("week", [valued("100")])))).toMatchObject({
        countervalues: { USD: "100" },
      });
    });

    it("keeps them through a read without countervalue while the point is unchanged", () => {
      const state = reduce(receive("week", [valued("100")]), receive("week", [plain()]));
      expect(pointOf(state)).toMatchObject({ countervalues: { USD: "100" } });
    });

    it("drops them once the point's balance changed", () => {
      const state = reduce(receive("week", [valued("100")]), receive("week", [plain("6")]));
      expect(pointOf(state)).not.toHaveProperty("countervalues");
    });

    it("adds another countervalue next to the kept one, the latest read winning its own", () => {
      const eur = mockAssetBalanceHistory({
        points: [{ date: "2026-01-01T00:00:00.000Z", balance: "5", countervalues: { EUR: "90" } }],
      });
      const state = reduce(receive("week", [valued("100")]), receive("week", [eur]));
      expect(pointOf(state)).toMatchObject({ countervalues: { USD: "100", EUR: "90" } });
    });

    it("adds the countervalues of an older answer to the unchanged points of the newer series", () => {
      const state = reduce(
        receive("week", [plain()], accountUUID, 2),
        receive("week", [valued("100")], accountUUID, 1),
      );
      expect(state[accountUUID]?.week?.revision).toBe(2);
      expect(pointOf(state)).toMatchObject({ balance: "5", countervalues: { USD: "100" } });
    });

    it("keeps the newer series' own countervalues over an older answer's", () => {
      const state = reduce(
        receive("week", [valued("120")], accountUUID, 2),
        receive("week", [valued("100")], accountUUID, 1),
      );
      expect(pointOf(state)).toMatchObject({ countervalues: { USD: "120" } });
    });

    it("leaves out an older answer's countervalues when the point's balance changed", () => {
      const state = reduce(
        receive("week", [plain("6")], accountUUID, 2),
        receive("week", [valued("100")], accountUUID, 1),
      );
      expect(pointOf(state)).toEqual({ date: "2026-01-01T00:00:00.000Z", balance: "6" });
    });
  });
});
