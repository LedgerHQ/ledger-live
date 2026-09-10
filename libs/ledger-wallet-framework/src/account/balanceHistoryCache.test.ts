import BigNumber from "bignumber.js";
import type { AccountLike, Operation } from "@ledgerhq/types-live";
import {
  startOfHour,
  startOfDay,
  startOfWeek,
  generateHistoryFromOperations,
} from "./balanceHistoryCache";

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

describe("generateHistoryFromOperations", () => {
  // Fixed so the "days ago" fixture below (and the graph it produces) doesn't drift with the
  // date the suite happens to run on.
  const FIXED_NOW = new Date("2024-06-15T12:00:00.000Z");
  const DAY_MS = 24 * 60 * 60 * 1000;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const outOp = (daysAgo: number, value: number): Operation =>
    ({
      id: `op-${daysAgo}`,
      hash: `hash-${daysAgo}`,
      type: "OUT",
      value: new BigNumber(value),
      fee: new BigNumber(0),
      senders: ["addr"],
      recipients: ["other"],
      blockHeight: 1000 - daysAgo,
      blockHash: null,
      accountId: "acc",
      date: new Date(FIXED_NOW.getTime() - daysAgo * DAY_MS),
      extra: {},
    }) as unknown as Operation;

  it("matches the full-history graph over a bounded account's retained window, and stops rather than diverging beyond it", () => {
    // Newest-first, matching the framework's own contract on `account.operations`.
    const fullOperations = Array.from({ length: 9 }, (_, i) => outOp(i + 1, 10));
    // The store bound keeps the newest N: the same prefix, not an arbitrary subset.
    const boundedOperations = fullOperations.slice(0, 3);

    const fullAccount = {
      balance: new BigNumber(100),
      operations: fullOperations,
    } as unknown as AccountLike;
    const boundedAccount = {
      balance: new BigNumber(100),
      operations: boundedOperations,
    } as unknown as AccountLike;

    const fullHistory = generateHistoryFromOperations(fullAccount);
    const boundedHistory = generateHistoryFromOperations(boundedAccount);

    // The bounded graph is strictly shorter: once its own (retained) operations run out, the walk
    // stops rather than continuing with a fabricated or repeated value.
    expect(boundedHistory.DAY.balances.length).toBeGreaterThan(0);
    expect(boundedHistory.DAY.balances.length).toBeLessThan(fullHistory.DAY.balances.length);

    // Both arrays are oldest-first and right-aligned to the same "now" bucket, so comparing the
    // most recent `boundedHistory` buckets against the same tail of `fullHistory` is the correct
    // alignment -- and, over that shared retained window, the two must agree exactly.
    const boundedBalances = boundedHistory.DAY.balances;
    const fullTail = fullHistory.DAY.balances.slice(-boundedBalances.length);
    expect(boundedBalances).toEqual(fullTail);

    // The length gap is attributable exactly to the 6 dropped operations (each on its own day,
    // by construction) -- proving the bound genuinely shortened the walk, not a coincidence.
    expect(fullHistory.DAY.balances.length - boundedBalances.length).toBe(
      fullOperations.length - boundedOperations.length,
    );
  });
});
