import { anOperation } from "@ledgerhq/account-module-framework/test-utils";
import { balanceChange, balancesAt, MAX_ALL_POINTS, sampleTimes } from "./sampling";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const now = Date.parse("2026-01-10T10:20:00.000Z");
const iso = (times: number[]) => times.map(time => new Date(time).toISOString());

describe("sampleTimes", () => {
  it("samples the last day hourly, on the hour, then now", () => {
    const times = iso(sampleTimes("day", now));

    expect(times).toHaveLength(25);
    expect(times.slice(0, 2)).toEqual(["2026-01-09T11:00:00.000Z", "2026-01-09T12:00:00.000Z"]);
    expect(times.slice(-2)).toEqual(["2026-01-10T10:00:00.000Z", "2026-01-10T10:20:00.000Z"]);
  });

  it.each([
    ["hour", 5 * MINUTE, 13],
    ["week", 6 * HOUR, 29],
    ["month", DAY, 31],
    ["year", 7 * DAY, 53],
  ] as const)("samples a %s every step up to now", (range, step, count) => {
    const times = sampleTimes(range, now);

    expect(times).toHaveLength(count);
    expect(times.at(-1)).toBe(now);
    expect(times[1]! - times[0]!).toBe(step);
  });

  it("samples all the history daily since the oldest operation", () => {
    const since = Date.parse("2026-01-07T15:00:00.000Z");

    expect(iso(sampleTimes("all", now, since))).toEqual([
      "2026-01-08T00:00:00.000Z",
      "2026-01-09T00:00:00.000Z",
      "2026-01-10T00:00:00.000Z",
      "2026-01-10T10:20:00.000Z",
    ]);
  });

  it("samples a long history less often than daily, to stay within the cap", () => {
    const times = sampleTimes("all", now, now - 4000 * DAY);

    expect(times.length).toBeLessThanOrEqual(MAX_ALL_POINTS + 1);
    expect(times[1]! - times[0]!).toBe(11 * DAY);
  });

  it("samples only now for all of an empty history, or one dated in the future", () => {
    expect(sampleTimes("all", now)).toEqual([now]);
    expect(sampleTimes("all", now, now + DAY)).toEqual([now]);
  });
});

describe("balanceChange", () => {
  it("adds incoming values and subtracts outgoing ones", () => {
    expect(balanceChange(anOperation({ type: "IN", value: 5n }))).toBe(5n);
    expect(balanceChange(anOperation({ type: "REWARD", value: 2n }))).toBe(2n);
    expect(balanceChange(anOperation({ type: "OUT", value: 7n }))).toBe(-7n);
    expect(balanceChange(anOperation({ type: "FEES", value: 1n }))).toBe(-1n);
    expect(balanceChange(anOperation({ type: "DELEGATE", value: 3n }))).toBe(-3n);
  });

  it("ignores operations with no balance impact", () => {
    expect(balanceChange(anOperation({ type: "NONE", value: 5n }))).toBe(0n);
  });

  it("subtracts only the fee of a failed operation, and only from the native asset", () => {
    const failed = { type: "OUT", value: 10n, fee: 1n, failed: true };

    expect(balanceChange(anOperation(failed))).toBe(-1n);
    expect(balanceChange(anOperation({ ...failed, asset: { type: "erc20" } }))).toBe(0n);
  });
});

describe("balancesAt", () => {
  it("walks back from the current balance through the operations, newest first", () => {
    const operations = [
      anOperation({ type: "OUT", value: 3n, date: new Date(30) }),
      anOperation({ type: "IN", value: 10n, date: new Date(20) }),
      anOperation({ type: "IN", value: 1n, date: new Date(10) }),
    ];

    expect(balancesAt([5, 10, 25, 30, 40], 8n, operations)).toEqual([0n, 1n, 11n, 8n, 8n]);
  });
});
