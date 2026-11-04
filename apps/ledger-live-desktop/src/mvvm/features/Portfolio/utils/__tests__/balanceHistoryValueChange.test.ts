import { CountervalueTickerSchema } from "@domain/entity-account-balance";
import {
  AssetBalanceHistorySchema,
  type AssetBalanceHistory,
} from "@domain/entity-account-balance-history";
import { balanceHistoryValueChange, endBalanceHistoryAt } from "../balanceHistoryValueChange";

const usd = CountervalueTickerSchema.parse("USD");

function asset(
  assetId: string,
  points: { date: string; balance: string; countervalue?: string }[],
): AssetBalanceHistory {
  return AssetBalanceHistorySchema.parse({
    assetId,
    points: points.map(point => ({
      date: point.date,
      balance: point.balance,
      countervalues: point.countervalue === undefined ? undefined : { USD: point.countervalue },
    })),
  });
}

describe("balanceHistoryValueChange", () => {
  it("should sum assets on their own dates and carry the last known worth", () => {
    const change = balanceHistoryValueChange(
      [
        [
          asset("ethereum", [
            { date: "2026-01-01T00:00:00.000Z", balance: "1", countervalue: "100" },
            { date: "2026-01-03T00:00:00.000Z", balance: "1", countervalue: "150" },
          ]),
        ],
        [
          asset("bitcoin", [
            { date: "2026-01-02T00:00:00.000Z", balance: "1", countervalue: "40" },
          ]),
        ],
      ],
      usd,
    );

    expect(change?.balanceHistory.map(point => point.value)).toEqual([100, 140, 190]);
    expect(change?.valueChange).toEqual({ value: 90, percentage: 0.9 });
  });

  it("should measure the change from the first non-zero worth", () => {
    const change = balanceHistoryValueChange(
      [
        [
          asset("ethereum", [
            { date: "2026-01-01T00:00:00.000Z", balance: "0", countervalue: "0" },
            { date: "2026-01-02T00:00:00.000Z", balance: "1", countervalue: "50" },
            { date: "2026-01-03T00:00:00.000Z", balance: "1", countervalue: "80" },
          ]),
        ],
      ],
      usd,
    );

    expect(change?.valueChange).toEqual({ value: 30, percentage: 0.6 });
  });

  it("should keep the previous worth when a later point has no countervalue", () => {
    const change = balanceHistoryValueChange(
      [
        [
          asset("ethereum", [
            { date: "2026-01-01T00:00:00.000Z", balance: "1", countervalue: "100" },
            { date: "2026-01-02T00:00:00.000Z", balance: "2" },
          ]),
        ],
      ],
      usd,
    );

    expect(change?.balanceHistory.map(point => point.value)).toEqual([100, 100]);
    expect(change?.valueChange).toEqual({ value: 0, percentage: undefined });
  });

  it("should be unavailable when the first point has no countervalue", () => {
    const change = balanceHistoryValueChange(
      [
        [
          asset("ethereum", [
            { date: "2026-01-01T00:00:00.000Z", balance: "1" },
            { date: "2026-01-02T00:00:00.000Z", balance: "1", countervalue: "100" },
          ]),
        ],
      ],
      usd,
    );

    expect(change).toBeUndefined();
  });

  it("should be unavailable when no account has a point", () => {
    expect(balanceHistoryValueChange([[asset("ethereum", [])]], usd)).toBeUndefined();
  });

  it("should leave the percentage unset when the ratio is not meaningful", () => {
    const change = balanceHistoryValueChange(
      [
        [
          asset("ethereum", [
            { date: "2026-01-01T00:00:00.000Z", balance: "1", countervalue: "1" },
            { date: "2026-01-02T00:00:00.000Z", balance: "1", countervalue: "200000" },
          ]),
        ],
      ],
      usd,
    );

    expect(change?.valueChange).toEqual({ value: 199999, percentage: undefined });
  });
});

describe("endBalanceHistoryAt", () => {
  it("should end the series and the change on the current worth", () => {
    const change = balanceHistoryValueChange(
      [
        [
          asset("bitcoin", [
            { date: "2026-01-01T00:00:00.000Z", balance: "1", countervalue: "60000" },
            { date: "2026-01-01T12:00:00.000Z", balance: "1", countervalue: "61810" },
          ]),
        ],
      ],
      usd,
    );
    const ended = change && endBalanceHistoryAt(change, 61948);

    expect(ended?.balanceHistory.map(point => point.value)).toEqual([60000, 61948]);
    expect(ended?.valueChange).toEqual({ value: 1948, percentage: 1948 / 60000 });
  });
});
