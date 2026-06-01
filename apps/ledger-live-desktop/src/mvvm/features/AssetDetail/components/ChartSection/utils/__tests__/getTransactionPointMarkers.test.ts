import {
  groupTransactionsByChartIndex,
  type TransactionInput,
} from "../getTransactionPointMarkers";

const timestamps = [1000, 2000, 3000, 4000];
const values = [10, 20, 30, 40];

describe("groupTransactionsByChartIndex", () => {
  it("returns no groups when there are fewer than two timestamps", () => {
    expect(
      groupTransactionsByChartIndex({
        timestamps: [1000],
        values: [10],
        transactions: [{ dateMs: 1000, direction: "in", fiat: 5 }],
      }),
    ).toEqual([]);
  });

  it("maps a transaction to the nearest data point within the window", () => {
    const groups = groupTransactionsByChartIndex({
      timestamps,
      values,
      transactions: [{ dateMs: 2100, direction: "in", fiat: 12 }],
    });

    expect(groups).toEqual([
      {
        index: 1,
        value: 20,
        dateMs: 2100,
        receivedCount: 1,
        sentCount: 0,
        receivedFiat: 12,
        sentFiat: 0,
      },
    ]);
  });

  it("ignores transactions outside the visible window", () => {
    const groups = groupTransactionsByChartIndex({
      timestamps,
      values,
      transactions: [
        { dateMs: 500, direction: "in", fiat: 1 },
        { dateMs: 5000, direction: "out", fiat: 1 },
      ],
    });

    expect(groups).toEqual([]);
  });

  it("aggregates received and sent counts and fiat for a mixed day on the same point", () => {
    const transactions: TransactionInput[] = [
      { dateMs: 2900, direction: "in", fiat: 30 },
      { dateMs: 3100, direction: "out", fiat: 5 },
      { dateMs: 3050, direction: "in", fiat: 10 },
    ];

    const groups = groupTransactionsByChartIndex({ timestamps, values, transactions });

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      index: 2,
      value: 30,
      receivedCount: 2,
      sentCount: 1,
      receivedFiat: 40,
      sentFiat: 5,
    });
  });

  it("excludes null fiat from totals but still counts the transaction", () => {
    const groups = groupTransactionsByChartIndex({
      timestamps,
      values,
      transactions: [
        { dateMs: 1000, direction: "in", fiat: null },
        { dateMs: 1000, direction: "in", fiat: 7 },
      ],
    });

    expect(groups[0]).toMatchObject({ receivedCount: 2, receivedFiat: 7 });
  });

  it("drops transactions mapping to a point with a missing value", () => {
    const groups = groupTransactionsByChartIndex({
      timestamps,
      values: [10, NaN, 30, 40],
      transactions: [{ dateMs: 2000, direction: "in", fiat: 5 }],
    });

    expect(groups).toEqual([]);
  });
});
