import {
  groupTransactionsByChartIndex,
  type TransactionInput,
} from "../getTransactionPointMarkers";

const timestamps = [1000, 2000, 3000, 4000];
const values = [10, 20, 30, 40];

describe("groupTransactionsByChartIndex", () => {
  it.each([
    [
      "fewer than two timestamps",
      {
        timestamps: [1000],
        values: [10],
        transactions: [{ dateMs: 1000, direction: "in" as const, fiat: 5 }],
      },
    ],
    [
      "the visible window",
      {
        timestamps,
        values,
        transactions: [
          { dateMs: 500, direction: "in" as const, fiat: 1 },
          { dateMs: 5000, direction: "out" as const, fiat: 1 },
        ],
      },
    ],
    [
      "a chart point with a missing value",
      {
        timestamps,
        values: [10, NaN, 30, 40],
        transactions: [{ dateMs: 2000, direction: "in" as const, fiat: 5 }],
      },
    ],
  ])("returns no groups when %s", (_, params) => {
    expect(groupTransactionsByChartIndex(params)).toEqual([]);
  });

  it("maps transactions to nearest chart points within the window", () => {
    const groups = groupTransactionsByChartIndex({
      timestamps,
      values,
      transactions: [
        { dateMs: 1000, direction: "in", fiat: 1 },
        { dateMs: 2100, direction: "in", fiat: 12 },
        { dateMs: 4000, direction: "out", fiat: 8 },
      ],
    });

    expect(groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ index: 0, receivedFiat: 1 }),
        expect.objectContaining({ index: 1, receivedFiat: 12 }),
        expect.objectContaining({ index: 3, sentFiat: 8 }),
      ]),
    );
  });

  it("keeps the lower index when two points are equally near", () => {
    const [group] = groupTransactionsByChartIndex({
      timestamps: [1000, 2000],
      values: [10, 20],
      transactions: [{ dateMs: 1500, direction: "in", fiat: 3 }],
    });

    expect(group).toMatchObject({ index: 0, value: 10, receivedCount: 1, receivedFiat: 3 });
  });

  it("aggregates received and sent on the same point", () => {
    const transactions: TransactionInput[] = [
      { dateMs: 2900, direction: "in", fiat: 30 },
      { dateMs: 3100, direction: "out", fiat: 5 },
      { dateMs: 3050, direction: "in", fiat: 10 },
    ];

    const [group] = groupTransactionsByChartIndex({ timestamps, values, transactions });

    expect(group).toMatchObject({
      index: 2,
      receivedCount: 2,
      sentCount: 1,
      receivedFiat: 40,
      sentFiat: 5,
    });
  });

  it("groups across points after sorting unsorted input", () => {
    const groups = groupTransactionsByChartIndex({
      timestamps,
      values,
      transactions: [
        { dateMs: 3100, direction: "out", fiat: 5 },
        { dateMs: 1100, direction: "in", fiat: 1 },
      ],
    });

    expect(groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ index: 0, receivedFiat: 1 }),
        expect.objectContaining({ index: 2, sentFiat: 5 }),
      ]),
    );
  });

  it.each([
    ["null", null],
    ["NaN", Number.NaN],
  ])("excludes %s fiat from totals but still counts the transaction", (_, fiat) => {
    const groups = groupTransactionsByChartIndex({
      timestamps,
      values,
      transactions: [{ dateMs: 1000, direction: "out", fiat }],
    });

    expect(groups[0]).toMatchObject({ sentCount: 1, sentFiat: 0 });
  });
});
