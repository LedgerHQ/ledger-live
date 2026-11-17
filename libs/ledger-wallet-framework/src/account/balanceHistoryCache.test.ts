import BigNumber from "bignumber.js";
import type { AccountLike, GranularityId, Operation } from "@ledgerhq/types-live";
import {
  startOfHour,
  startOfDay,
  startOfWeek,
  generateHistoryFromOperations,
  getAccountHistoryBalances,
  refreshHistoryFromOperations,
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

describe("history from a saved cache", () => {
  const HOUR_MS = 60 * 60 * 1000;
  const DAY_MS = 24 * HOUR_MS;
  const SAVED_AT = new Date("2024-03-08T15:30:00.000Z");

  afterEach(() => {
    jest.useRealTimers();
  });

  const at = (date: Date) => {
    jest.useFakeTimers();
    jest.setSystemTime(date);
  };

  // Deterministic, so a failure replays with the same accounts.
  const random = (() => {
    let seed = 42;
    return () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
  })();

  const randomAccount = (until: Date): AccountLike => {
    const types = ["IN", "OUT", "FEES"];
    const operations = Array.from({ length: Math.floor(random() * 40) }, (_, i) => ({
      id: `op-${i}`,
      type: types[Math.floor(random() * types.length)],
      value: new BigNumber(Math.floor(random() * 1000)),
      fee: new BigNumber(Math.floor(random() * 10)),
      date: new Date(until.getTime() - Math.floor(random() * 3 * 365 * DAY_MS)),
      extra: {},
    })).sort((a, b) => b.date.getTime() - a.date.getTime());
    return {
      balance: new BigNumber(Math.floor(random() * 20000)),
      operations,
    } as unknown as AccountLike;
  };

  const inOperation = (daysBeforeSave: number, value: number) => ({
    id: `op-${daysBeforeSave}`,
    type: "IN",
    value: new BigNumber(value),
    fee: new BigNumber(0),
    date: new Date(SAVED_AT.getTime() - daysBeforeSave * DAY_MS),
    extra: {},
  });

  const savedThen = (account: AccountLike, savedAt: Date): AccountLike => {
    at(savedAt);
    return { ...account, balanceHistoryCache: generateHistoryFromOperations(account) };
  };

  it("should keep each granularity saved in the current period", () => {
    const account = savedThen(randomAccount(SAVED_AT), SAVED_AT);
    at(new Date(SAVED_AT.getTime() + 10 * 60 * 1000));

    const refreshed = refreshHistoryFromOperations(account);

    expect(refreshed.HOUR).toBe(account.balanceHistoryCache.HOUR);
    expect(refreshed.DAY).toBe(account.balanceHistoryCache.DAY);
    expect(refreshed.WEEK).toBe(account.balanceHistoryCache.WEEK);
  });

  it("should match a regeneration whatever time elapsed since the cache was saved", () => {
    const elapsedRanges = [3 * HOUR_MS, 3 * DAY_MS, 60 * DAY_MS, 3 * 365 * DAY_MS];
    for (let trial = 0; trial < 400; trial++) {
      const savedAt = new Date(SAVED_AT.getTime() + Math.floor(random() * 365 * DAY_MS));
      const elapsed = Math.floor(random() * elapsedRanges[trial % elapsedRanges.length]);
      const account = savedThen(randomAccount(savedAt), savedAt);
      at(new Date(savedAt.getTime() + elapsed));

      expect(refreshHistoryFromOperations(account)).toEqual(generateHistoryFromOperations(account));
    }
  });

  it("should match a regeneration across a daylight saving change", () => {
    const beforeDstChange = new Date("2024-03-09T17:00:00.000Z");
    const account = savedThen(randomAccount(beforeDstChange), beforeDstChange);
    at(new Date("2024-03-11T17:00:00.000Z"));

    expect(refreshHistoryFromOperations(account)).toEqual(generateHistoryFromOperations(account));
  });

  it("should match a regeneration when the operations are dated after the cache was saved", () => {
    const account = {
      balance: new BigNumber(500),
      operations: [5, 3].map(hoursAfterSave => inOperation(-hoursAfterSave / 24, 100)),
    } as unknown as AccountLike;
    const saved = savedThen(account, SAVED_AT);
    at(new Date(SAVED_AT.getTime() + 2 * DAY_MS));

    expect(refreshHistoryFromOperations(saved)).toEqual(generateHistoryFromOperations(saved));
  });

  it("should keep the saved points while subtracting the operations added since the save", () => {
    const account = {
      balance: new BigNumber(300),
      operations: [inOperation(1, 200), inOperation(6, 100)],
    } as unknown as AccountLike;
    const saved = savedThen(account, SAVED_AT);
    const operationsSinceSave = [5, 3].map(hoursAfterSave =>
      inOperation(-hoursAfterSave / 24, 100),
    );
    const synced = {
      ...saved,
      balance: new BigNumber(500),
      operations: [...operationsSinceSave, ...saved.operations],
    } as AccountLike;
    const withoutTheOldestOperation = {
      ...synced,
      operations: synced.operations.slice(0, -1),
    } as AccountLike;
    at(new Date(SAVED_AT.getTime() + 2 * DAY_MS));

    expect(refreshHistoryFromOperations(withoutTheOldestOperation)).toEqual(
      generateHistoryFromOperations(synced),
    );
  });

  const accountWithThreeOperations = () =>
    ({
      balance: new BigNumber(600),
      operations: [1, 5, 9].map(daysBeforeSave => inOperation(daysBeforeSave, 200)),
    }) as unknown as AccountLike;

  it("should keep the saved points of operations dropped since the save", () => {
    const account = savedThen(accountWithThreeOperations(), SAVED_AT);
    const withoutTheOldestOperation = {
      ...account,
      operations: account.operations.filter(operation => operation.id !== "op-9"),
    } as AccountLike;
    at(new Date(SAVED_AT.getTime() + DAY_MS));

    expect(refreshHistoryFromOperations(withoutTheOldestOperation)).toEqual(
      generateHistoryFromOperations(account),
    );
  });

  it("should regenerate a cache saved with another balance", () => {
    const account = savedThen(accountWithThreeOperations(), SAVED_AT);
    const withAnotherBalance = { ...account, balance: new BigNumber(700) } as AccountLike;
    at(new Date(SAVED_AT.getTime() + DAY_MS));

    expect(refreshHistoryFromOperations(withAnotherBalance)).toEqual(
      generateHistoryFromOperations(withAnotherBalance),
    );
  });

  it("should regenerate a cache that does not match the operations", () => {
    const account = savedThen(randomAccount(SAVED_AT), SAVED_AT);
    const { DAY } = account.balanceHistoryCache;
    const mismatched = {
      ...account,
      balanceHistoryCache: {
        ...account.balanceHistoryCache,
        DAY: { ...DAY, balances: [...DAY.balances.slice(0, -1), -1] },
      },
    };
    at(new Date(SAVED_AT.getTime() + DAY_MS));

    expect(refreshHistoryFromOperations(mismatched)).toEqual(
      generateHistoryFromOperations(mismatched),
    );
  });

  it("should regenerate every granularity of an account without a cache", () => {
    const account = randomAccount(SAVED_AT);
    at(SAVED_AT);

    expect(refreshHistoryFromOperations(account)).toEqual(generateHistoryFromOperations(account));
  });

  it.each<GranularityId>(["HOUR", "DAY", "WEEK"])(
    "should show the %s points of a regeneration while the cache is from an earlier period",
    granularity => {
      const elapsedRanges = [3 * HOUR_MS, 3 * DAY_MS, 60 * DAY_MS, 3 * 365 * DAY_MS];
      for (let trial = 0; trial < 100; trial++) {
        const savedAt = new Date(SAVED_AT.getTime() + Math.floor(random() * 365 * DAY_MS));
        const elapsed = Math.floor(random() * elapsedRanges[trial % elapsedRanges.length]);
        const account = savedThen(randomAccount(savedAt), savedAt);
        at(new Date(savedAt.getTime() + elapsed));

        expect(getAccountHistoryBalances(account, granularity)).toEqual(
          generateHistoryFromOperations(account)[granularity].balances,
        );
      }
    },
  );
});
