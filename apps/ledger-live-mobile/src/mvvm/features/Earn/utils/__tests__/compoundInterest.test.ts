import { computeProjections, YearProjection } from "../compoundInterest";

describe("computeProjections", () => {
  it("returns one entry per year", () => {
    const result = computeProjections(1000, 100, 7.32, 10);
    expect(result).toHaveLength(10);
    expect(result.map(r => r.year)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("computes correct deposits (linear accumulation)", () => {
    const result = computeProjections(1000, 100, 5, 3);
    expect(result[0].deposits).toBe(1000 + 100 * 12 * 1); // 2200
    expect(result[1].deposits).toBe(1000 + 100 * 12 * 2); // 3400
    expect(result[2].deposits).toBe(1000 + 100 * 12 * 3); // 4600
  });

  it("computes positive rewards when APY > 0", () => {
    const result = computeProjections(1000, 100, 7.32, 10);
    result.forEach(p => {
      expect(p.rewards).toBeGreaterThan(0);
    });
  });

  it("rewards grow over time", () => {
    const result = computeProjections(1000, 100, 7.32, 10);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].rewards).toBeGreaterThan(result[i - 1].rewards);
    }
  });

  it("returns zero rewards when APY is 0", () => {
    const result = computeProjections(1000, 100, 0, 5);
    result.forEach(p => {
      expect(p.rewards).toBe(0);
    });
  });

  it("handles zero monthly deposit", () => {
    const result = computeProjections(10000, 0, 5, 1);
    expect(result[0].deposits).toBe(10000);
    expect(result[0].rewards).toBeGreaterThan(0);
  });

  it("handles zero initial deposit", () => {
    const result = computeProjections(0, 500, 10, 1);
    expect(result[0].deposits).toBe(6000);
    expect(result[0].rewards).toBeGreaterThan(0);
  });

  it("matches expected value for known inputs", () => {
    // $1000 initial, $100/mo, 7.32% APY, 10 years
    const result = computeProjections(1000, 100, 7.32, 10);
    const year10 = result[9];
    expect(year10.deposits).toBe(13000);
    const totalValue = year10.deposits + year10.rewards;
    expect(totalValue).toBeGreaterThan(18000);
    expect(totalValue).toBeLessThan(22000);
  });

  it("returns all YearProjection fields with correct types", () => {
    const result = computeProjections(1000, 100, 5, 1);
    const entry: YearProjection = result[0];
    expect(typeof entry.year).toBe("number");
    expect(typeof entry.deposits).toBe("number");
    expect(typeof entry.rewards).toBe("number");
  });
});
