import { downsampleChartPoints, MAX_SERIES_POINTS } from "../utils/downsampleChartPoints";

const ramp = (length: number, fn: (i: number) => number = i => i): number[] =>
  Array.from({ length }, (_, i) => fn(i));

describe("downsampleChartPoints", () => {
  it("returns the input untouched when already at or below the cap", () => {
    const timestamps = [1, 2, 3];
    const values = [10, 20, 30];

    const result = downsampleChartPoints(timestamps, values, 5);

    expect(result.timestamps).toBe(timestamps);
    expect(result.values).toBe(values);
  });

  it("reduces a long series to at most maxPoints", () => {
    const length = 350;

    const result = downsampleChartPoints(ramp(length), ramp(length, Math.sin), MAX_SERIES_POINTS);

    expect(result.values.length).toBeLessThanOrEqual(MAX_SERIES_POINTS + 2);
    expect(result.values.length).toBeLessThan(length);
    expect(result.timestamps.length).toBe(result.values.length);
  });

  it("keeps timestamps and values aligned on the same kept indices", () => {
    // values[i] === index, timestamps[i] === index * 1000, so the pairing must hold.
    const result = downsampleChartPoints(
      ramp(300, i => i * 1000),
      ramp(300),
      50,
    );

    result.values.forEach((value, i) => {
      expect(result.timestamps[i]).toBe(value * 1000);
    });
  });

  it("preserves the first, last, min and max points", () => {
    const length = 200;
    const values = ramp(length);
    values[123] = -999; // global min
    values[77] = 9999; // global max

    const result = downsampleChartPoints(ramp(length), values, 30);

    expect(result.values[0]).toBe(values[0]);
    expect(result.values[result.values.length - 1]).toBe(values[length - 1]);
    expect(result.values).toContain(-999);
    expect(result.values).toContain(9999);
  });

  it("returns a strictly increasing timestamp sequence (sorted, de-duplicated indices)", () => {
    const result = downsampleChartPoints(
      ramp(250),
      ramp(250, i => (i % 7) - 3),
      40,
    );

    for (let i = 1; i < result.timestamps.length; i++) {
      expect(result.timestamps[i]).toBeGreaterThan(result.timestamps[i - 1]);
    }
  });
});
