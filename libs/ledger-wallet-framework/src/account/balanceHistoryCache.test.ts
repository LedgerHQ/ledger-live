import {
  createEmptyHistoryCache,
  generateHistoryFromOperations,
  getAccountHistoryBalances,
  startOfHour,
  startOfDay,
  startOfWeek,
} from "./balanceHistoryCache";
import { genAccount } from "../mocks/account";

const HOUR = 60 * 60 * 1000;

describe("date utils", () => {
  describe("Timezones", () => {
    it("should always be America/New_York", () => {
      expect(process.env.TZ).toBe("America/New_York");
    });
  });

  describe("startOfHour", () => {
    test("basic test", () => {
      expect(startOfHour(new Date(1655827384305)).toISOString()).toBe("2022-06-21T16:00:00.000Z");
    });
  });
  describe("startOfDay", () => {
    test("basic test", () => {
      expect(startOfDay(new Date(1655827384305)).toISOString()).toBe("2022-06-21T04:00:00.000Z");
    });
  });
  describe("startOfWeek", () => {
    test("basic test", () => {
      expect(startOfWeek(new Date(1655827384305)).toISOString()).toBe("2022-06-19T04:00:00.000Z");
    });
  });
});

describe("getAccountHistoryBalances", () => {
  // The series length must follow the requested granularity, not how many operations the
  // account happens to have. A short series is padded with 0 by the portfolio graph, which
  // renders as a spike out of nothing.
  describe("series length is driven by the granularity, not the operation count", () => {
    it("covers the full window for an account with no operations at all", () => {
      const base = genAccount("bhc_no_ops");
      const account = {
        ...base,
        operations: [],
        balanceHistoryCache: createEmptyHistoryCache(),
      };

      const balances = getAccountHistoryBalances(account, "HOUR");

      // "week" asks for 7 * 24 hourly points, so anything shorter is padded with zeros.
      expect(balances.length).toBeGreaterThanOrEqual(7 * 24);
      expect(new Set(balances)).toEqual(new Set([account.balance.toNumber()]));
    });

    it("covers the full window for an account whose operations are all recent", () => {
      const base = genAccount("bhc_recent_ops");
      const recent = base.operations.slice(0, 2).map((op, i) => ({
        ...op,
        date: new Date(Date.now() - (i + 1) * HOUR),
      }));
      const account = {
        ...base,
        operations: recent,
        balanceHistoryCache: createEmptyHistoryCache(),
      };

      expect(getAccountHistoryBalances(account, "HOUR").length).toBeGreaterThanOrEqual(7 * 24);
    });
  });

  // The partial recompose walks back to reference.latestDate inclusive, but the stored series
  // already ends on that slot, so concatenating duplicates it and shifts everything older by one.
  it("does not duplicate the seam datapoint when extending a stored series", () => {
    const base = genAccount("bhc_seam");
    const full = generateHistoryFromOperations(base).HOUR;
    // the same series as it stood three hours ago: last slot is T-3h, so is latestDate
    const account = {
      ...base,
      balanceHistoryCache: {
        ...base.balanceHistoryCache,
        HOUR: {
          latestDate: (full.latestDate ?? 0) - 3 * HOUR,
          balances: full.balances.slice(0, -3),
        },
      },
    };

    // extending it must land on the same series a full rebuild produces
    expect(getAccountHistoryBalances(account, "HOUR")).toEqual(full.balances);
  });

  // The stored series is anchored to account.balance: generateHistoryFromOperations starts from it
  // and rewinds through the operations. Returning it on a timestamp check alone lets a series
  // anchored to a different balance through, and the portfolio graph then appends the live balance
  // as its final point, producing a cliff that reads as an outgoing transfer.
  it("re-anchors a cached series that no longer matches the live balance", () => {
    const base = genAccount("bhc_anchor");
    const latestDate = startOfHour(new Date()).getTime();
    const staleAnchor = base.balance.times(1.2).toNumber();
    const account = {
      ...base,
      // keep the current hour free of operations so the last slot must equal the balance itself
      operations: base.operations.filter(op => op.date.getTime() < latestDate),
      balanceHistoryCache: {
        ...base.balanceHistoryCache,
        HOUR: { latestDate, balances: new Array(8 * 24).fill(staleAnchor) },
      },
    };

    const balances = getAccountHistoryBalances(account, "HOUR");

    expect(balances[balances.length - 1]).toBe(account.balance.toNumber());
    expect(balances).toEqual(generateHistoryFromOperations(account).HOUR.balances);
  });
});
