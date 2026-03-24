import { computeProjections, YearProjection } from "../compoundInterest";

describe("computeProjections", () => {
  it("returns one entry per year", () => {
    const result = computeProjections(1000, 100, 7.32, 10);
    expect(result).toHaveLength(10);
    expect(result.map(r => r.year)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("computes deposits as cumulative linear accumulation", () => {
    const result = computeProjections(1000, 100, 5, 3);
    expect(result[0].deposits).toBe(1000 + 100 * 12 * 1); // 2200
    expect(result[1].deposits).toBe(1000 + 100 * 12 * 2); // 3400
    expect(result[2].deposits).toBe(1000 + 100 * 12 * 3); // 4600
  });

  it("compounds rewards: previous rewards earn interest in subsequent years", () => {
    const result = computeProjections(1000, 0, 10, 3);
    // Year 1: balance = 1000 + 0 = 1000, reward = 100, cumulative = 100
    expect(result[0].rewards).toBe(100);
    // Year 2: balance = 1000 + 100 = 1100, reward = 110, cumulative = 210
    expect(result[1].rewards).toBe(210);
    // Year 3: balance = 1000 + 210 = 1210, reward = 121, cumulative = 331
    expect(result[2].rewards).toBe(331);
  });

  it("rewards grow over time even with zero monthly deposit", () => {
    const result = computeProjections(1000, 0, 7.32, 10);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].rewards).toBeGreaterThan(result[i - 1].rewards);
    }
  });

  it("rewards grow over time when deposits also grow", () => {
    const result = computeProjections(500, 100, 7.32, 10);
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

  it("handles zero monthly deposit with compounding", () => {
    const result = computeProjections(10000, 0, 5, 3);
    expect(result[0].deposits).toBe(10000);
    expect(result[1].deposits).toBe(10000);
    expect(result[2].deposits).toBe(10000);
    // Year 1: 5% of 10000 = 500, cumulative = 500
    expect(result[0].rewards).toBe(500);
    // Year 2: 5% of (10000 + 500) = 525, cumulative = 1025
    expect(result[1].rewards).toBe(1025);
    // Year 3: 5% of (10000 + 1025) = 551.25, cumulative = 1576.25 → 1576
    expect(result[2].rewards).toBe(1576);
  });

  it("handles zero initial deposit", () => {
    const result = computeProjections(0, 500, 10, 2);
    // Year 1: deposits = 6000, balance = 6000 + 0 = 6000, reward = 600, cumulative = 600
    expect(result[0].deposits).toBe(6000);
    expect(result[0].rewards).toBe(600);
    // Year 2: deposits = 12000, balance = 12000 + 600 = 12600, reward = 1260, cumulative = 1860
    expect(result[1].deposits).toBe(12000);
    expect(result[1].rewards).toBe(1860);
  });

  it("handles both deposits at zero", () => {
    const result = computeProjections(0, 0, 7.32, 5);
    result.forEach(p => {
      expect(p.deposits).toBe(0);
      expect(p.rewards).toBe(0);
    });
  });

  it("matches exact compounding values for known inputs", () => {
    const result = computeProjections(1000, 100, 7.32, 3);
    // Year 1: deposits=2200, balance=2200, reward=161.04, cumulative=161.04 → 161
    expect(result[0].deposits).toBe(2200);
    expect(result[0].rewards).toBe(161);
    // Year 2: deposits=3400, balance=3400+161.04=3561.04, reward=260.67, cumulative=421.71 → 422
    expect(result[1].deposits).toBe(3400);
    expect(result[1].rewards).toBe(422);
    // Year 3: deposits=4600, balance=4600+421.71=5021.71, reward=367.59, cumulative=789.30 → 789
    expect(result[2].deposits).toBe(4600);
    expect(result[2].rewards).toBe(789);
  });

  it("returns all YearProjection fields with correct types", () => {
    const result = computeProjections(1000, 100, 5, 1);
    const entry: YearProjection = result[0];
    expect(typeof entry.year).toBe("number");
    expect(typeof entry.deposits).toBe("number");
    expect(typeof entry.rewards).toBe("number");
  });
});
