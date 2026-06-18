import {
  DEFAULT_MIN_SERIES_POINTS_BETWEEN_TX_MARKERS,
  getMinSeriesPointsBetweenTxMarkers,
  groupTransactionsByChartIndex,
  MIN_SERIES_POINTS_BETWEEN_TX_MARKERS,
  type TransactionChartGroup,
  type TransactionInput,
} from "../getTransactionPointMarkers";

const tx = (
  dateMs: number,
  direction: TransactionInput["direction"],
  fiat: number | null,
): TransactionInput => ({ dateMs, direction, fiat });

const expectedGroup = (overrides: Partial<TransactionChartGroup>): TransactionChartGroup => ({
  index: 0,
  value: 10,
  dateMs: 0,
  receivedCount: 0,
  sentCount: 0,
  receivedFiat: 0,
  sentFiat: 0,
  ...overrides,
});

describe("getMinSeriesPointsBetweenTxMarkers", () => {
  it.each([
    ["1d", DEFAULT_MIN_SERIES_POINTS_BETWEEN_TX_MARKERS],
    ["5y", 35],
    ["all", 50],
  ] as const)("returns the configured spacing for %s", (range, expected) => {
    expect(getMinSeriesPointsBetweenTxMarkers(range)).toBe(expected);
  });
});

describe("groupTransactionsByChartIndex", () => {
  const timestamps = [0, 100, 200, 300];
  const values = [10, 20, 30, 40];
  const run = (
    transactions: TransactionInput[],
    overrides: Partial<Parameters<typeof groupTransactionsByChartIndex>[0]> = {},
  ) => groupTransactionsByChartIndex({ timestamps, values, transactions, ...overrides });

  it("returns no groups when there are fewer than two timestamps", () => {
    expect(run([tx(0, "in", 1)], { timestamps: [0], values: [10] })).toEqual([]);
  });

  it("maps a transaction to the nearest chart index", () => {
    expect(run([tx(190, "in", 5)])).toEqual([
      expectedGroup({ index: 2, value: 30, dateMs: 190, receivedCount: 1, receivedFiat: 5 }),
    ]);
  });

  it("aggregates several transactions landing on the same index", () => {
    expect(run([tx(95, "in", 2), tx(105, "out", 3), tx(110, "in", 4)])).toEqual([
      expectedGroup({
        index: 1,
        value: 20,
        dateMs: 95,
        receivedCount: 2,
        sentCount: 1,
        receivedFiat: 6,
        sentFiat: 3,
      }),
    ]);
  });

  it("drops transactions outside the window", () => {
    expect(run([tx(-50, "in", 1), tx(400, "out", 1)])).toEqual([]);
  });

  it("excludes null/NaN fiat from totals but still counts the transaction", () => {
    expect(run([tx(0, "in", null), tx(0, "in", NaN)])).toEqual([
      expectedGroup({ receivedCount: 2 }),
    ]);
  });

  it("drops transactions mapping to a point with a missing value", () => {
    expect(run([tx(100, "in", 5)], { values: [10, NaN, 30, 40] })).toEqual([]);
  });

  it("keeps the lower index on a tie (pointer does not advance)", () => {
    expect(run([tx(50, "in", 1)], { timestamps: [0, 100], values: [10, 20] })[0].index).toBe(0);
  });

  it("maps transactions to nearest chart points within the window", () => {
    const groups = groupTransactionsByChartIndex({
      timestamps: [1000, 2000, 3000, 4000],
      values: [10, 20, 30, 40],
      transactions: [
        { dateMs: 1000, direction: "in", fiat: 1 },
        { dateMs: 2100, direction: "in", fiat: 12 },
        { dateMs: 4000, direction: "out", fiat: 8 },
      ],
      minSeriesPointsBetweenMarkers: 1,
    });

    expect(groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ index: 0, receivedFiat: 1 }),
        expect.objectContaining({ index: 1, receivedFiat: 12 }),
        expect.objectContaining({ index: 3, sentFiat: 8 }),
      ]),
    );
  });

  it("groups across points after sorting unsorted input", () => {
    const groups = groupTransactionsByChartIndex({
      timestamps: [1000, 2000, 3000, 4000],
      values: [10, 20, 30, 40],
      transactions: [
        { dateMs: 3100, direction: "out", fiat: 5 },
        { dateMs: 1100, direction: "in", fiat: 1 },
      ],
      minSeriesPointsBetweenMarkers: 1,
    });

    expect(groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ index: 0, receivedFiat: 1 }),
        expect.objectContaining({ index: 2, sentFiat: 5 }),
      ]),
    );
  });

  describe("minimum marker spacing (series-points)", () => {
    const longTimestamps = Array.from({ length: 100 }, (_, i) => i * 100);
    const longValues = Array.from({ length: 100 }, (_, i) => i + 1);
    const at = (index: number, direction: TransactionInput["direction"]) =>
      tx(index * 100, direction, 1);
    const runLong = (transactions: TransactionInput[], minSeriesPointsBetweenMarkers?: number) =>
      groupTransactionsByChartIndex({
        timestamps: longTimestamps,
        values: longValues,
        transactions,
        minSeriesPointsBetweenMarkers,
      });

    it("merges transactions within the gap into the cluster anchor and opens a new marker beyond it", () => {
      const groups = runLong([at(0, "in"), at(10, "in"), at(25, "out"), at(30, "in")], 20);

      expect(groups.map(g => g.index)).toEqual([0, 25]);
      expect(groups[0]).toMatchObject({ receivedCount: 2, sentCount: 0 });
      expect(groups[1]).toMatchObject({ index: 25, receivedCount: 1, sentCount: 1 });
    });

    it("collapses everything into one marker when the gap exceeds the window", () => {
      const groups = runLong([at(0, "in"), at(40, "in"), at(90, "out")], 1000);

      expect(groups).toHaveLength(1);
      expect(groups[0]).toMatchObject({ index: 0, receivedCount: 2, sentCount: 1 });
    });

    it("keeps adjacent distinct indices separate when the gap is 1", () => {
      expect(runLong([at(0, "in"), at(1, "in"), at(2, "out")], 1).map(g => g.index)).toEqual([
        0, 1, 2,
      ]);
    });

    it("applies the default spacing when none is provided", () => {
      const groups = runLong([at(0, "in"), at(MIN_SERIES_POINTS_BETWEEN_TX_MARKERS - 1, "in")]);

      expect(groups).toHaveLength(1);
      expect(groups[0].receivedCount).toBe(2);
    });
  });
});
