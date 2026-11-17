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
  mockAddressAccountDescriptor({ key: "0x0000000000000000000000000000000000000001" }),
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

const DATE = "2026-01-01T00:00:00.000Z";
const valued = (countervalues: Record<string, string>, balance = "5") =>
  mockAssetBalanceHistory({ points: [{ date: DATE, balance, countervalues }] });
const plain = (balance = "5") => mockAssetBalanceHistory({ points: [{ date: DATE, balance }] });
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
    it("should store the countervalues a read returned with its points", () => {
      expect(pointOf(reduce(receive("week", [valued({ USD: "100" })])))).toEqual({
        date: DATE,
        balance: "5",
        countervalues: { USD: "100" },
      });
    });

    it("should keep them through a read without countervalue while the point is unchanged", () => {
      const state = reduce(receive("week", [valued({ USD: "100" })]), receive("week", [plain()]));
      expect(pointOf(state)?.countervalues).toEqual({ USD: "100" });
    });

    it("should drop them once the point's balance changed", () => {
      const state = reduce(
        receive("week", [valued({ USD: "100" })]),
        receive("week", [plain("6")]),
      );
      expect(pointOf(state)).toEqual({ date: DATE, balance: "6" });
    });

    it("should add another fiat next to the kept one, the latest read winning its own", () => {
      const state = reduce(
        receive("week", [valued({ USD: "100", EUR: "80" })]),
        receive("week", [valued({ EUR: "90" })]),
      );
      expect(pointOf(state)?.countervalues).toEqual({ USD: "100", EUR: "90" });
    });

    it("should add an older answer's countervalues to the unchanged points of the newer series", () => {
      const state = reduce(
        receive("week", [plain()], accountUUID, 2),
        receive("week", [valued({ USD: "100" })], accountUUID, 1),
      );
      expect(state[accountUUID]?.week?.revision).toBe(2);
      expect(pointOf(state)?.countervalues).toEqual({ USD: "100" });
    });

    it("should leave the stored entry as is when an older answer adds no countervalue", () => {
      const newer = reduce(receive("week", [valued({ USD: "100" })], accountUUID, 2));
      const state = accountBalanceHistoriesReducer(
        newer,
        receive("week", [plain()], accountUUID, 1),
      );
      expect(state[accountUUID]?.week).toBe(newer[accountUUID]?.week);
    });

    it("should keep the newer series' own countervalues over an older answer's", () => {
      const state = reduce(
        receive("week", [valued({ USD: "120" })], accountUUID, 2),
        receive("week", [valued({ USD: "100" })], accountUUID, 1),
      );
      expect(pointOf(state)?.countervalues).toEqual({ USD: "120" });
    });

    it.each([
      ["1, 3, 2", [1, 3, 2]],
      ["1, 2, 3", [1, 2, 3]],
    ])(
      "should keep the latest fiat answer's values whatever the arrival order (%s)",
      (_, [first, second, third]) => {
        const answers: Record<number, AssetBalanceHistory> = {
          1: valued({ USD: "100" }),
          2: valued({ USD: "120" }),
          3: plain(),
        };
        const state = reduce(
          receive("week", [answers[first]], accountUUID, first),
          receive("week", [answers[second]], accountUUID, second),
          receive("week", [answers[third]], accountUUID, third),
        );
        expect(state[accountUUID]?.week?.revision).toBe(3);
        expect(pointOf(state)?.countervalues).toEqual({ USD: "120" });
      },
    );

    it.each([
      ["1, 3, 2", [1, 3, 2]],
      ["1, 2, 3", [1, 2, 3]],
    ])(
      "should keep each point's latest value when answers value different points (%s)",
      (_, [first, second, third]) => {
        const LATER = "2026-01-02T00:00:00.000Z";
        const twoPoints = (values: [string | undefined, string | undefined]) =>
          mockAssetBalanceHistory({
            points: [DATE, LATER].map((date, i) => {
              const value = values[i];
              return value === undefined
                ? { date, balance: "5" }
                : { date, balance: "5", countervalues: { USD: value } };
            }),
          });
        const answers: Record<number, AssetBalanceHistory> = {
          1: twoPoints(["100", "100"]),
          2: twoPoints(["200", "200"]),
          3: twoPoints(["300", undefined]),
        };
        const state = reduce(
          receive("week", [answers[first]], accountUUID, first),
          receive("week", [answers[second]], accountUUID, second),
          receive("week", [answers[third]], accountUUID, third),
        );
        const points = state[accountUUID]?.week?.series[0]?.points;
        expect(points?.map(point => point.countervalues)).toEqual([{ USD: "300" }, { USD: "200" }]);
      },
    );

    it("should keep the countervalues of a stored entry without revisions through a newer read without countervalue", () => {
      const preloaded: AccountBalanceHistoriesState = {
        [accountUUID]: { week: { revision: 1, series: [valued({ USD: "100" })] } },
      };
      const state = accountBalanceHistoriesReducer(
        preloaded,
        receive("week", [plain()], accountUUID, 2),
      );
      expect(pointOf(state)?.countervalues).toEqual({ USD: "100" });
    });

    it("should leave out an older answer's countervalues when the point's balance changed", () => {
      const state = reduce(
        receive("week", [plain("6")], accountUUID, 2),
        receive("week", [valued({ USD: "100" })], accountUUID, 1),
      );
      expect(pointOf(state)).toEqual({ date: DATE, balance: "6" });
    });
  });
});
