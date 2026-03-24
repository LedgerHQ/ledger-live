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

  it("computes rewards as simple yearly APY on cumulative deposits", () => {
    // rewards = Math.round(apy/100 * deposits)
    const result = computeProjections(1000, 100, 10, 3);
    // Year 1: deposits=2200, rewards=round(0.10 * 2200)=220
    expect(result[0].rewards).toBe(220);
    // Year 2: deposits=3400, rewards=round(0.10 * 3400)=340
    expect(result[1].rewards).toBe(340);
    // Year 3: deposits=4600, rewards=round(0.10 * 4600)=460
    expect(result[2].rewards).toBe(460);
  });

  it("rewards grow over time when deposits grow", () => {
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

  it("handles zero monthly deposit", () => {
    const result = computeProjections(10000, 0, 5, 3);
    // Deposits stay constant at initialDeposit every year
    expect(result[0].deposits).toBe(10000);
    expect(result[1].deposits).toBe(10000);
    expect(result[2].deposits).toBe(10000);
    // Rewards = round(0.05 * 10000) = 500 every year
    expect(result[0].rewards).toBe(500);
    expect(result[1].rewards).toBe(500);
    expect(result[2].rewards).toBe(500);
  });

  it("handles zero initial deposit", () => {
    const result = computeProjections(0, 500, 10, 2);
    // Year 1: deposits = 0 + 500*12*1 = 6000, rewards = round(0.10 * 6000) = 600
    expect(result[0].deposits).toBe(6000);
    expect(result[0].rewards).toBe(600);
    // Year 2: deposits = 0 + 500*12*2 = 12000, rewards = round(0.10 * 12000) = 1200
    expect(result[1].deposits).toBe(12000);
    expect(result[1].rewards).toBe(1200);
  });

  it("handles both deposits at zero", () => {
    const result = computeProjections(0, 0, 7.32, 5);
    result.forEach(p => {
      expect(p.deposits).toBe(0);
      expect(p.rewards).toBe(0);
    });
  });

  it("matches exact values for known inputs", () => {
    // $500 initial, $100/mo, 7.32% APY, 10 years
    const result = computeProjections(500, 100, 7.32, 10);
    const year1 = result[0];
    expect(year1.deposits).toBe(1700); // 500 + 100*12
    expect(year1.rewards).toBe(Math.round(0.0732 * 1700)); // 124

    const year10 = result[9];
    expect(year10.deposits).toBe(12500); // 500 + 100*12*10
    expect(year10.rewards).toBe(Math.round(0.0732 * 12500)); // 915
  });

  it("returns all YearProjection fields with correct types", () => {
    const result = computeProjections(1000, 100, 5, 1);
    const entry: YearProjection = result[0];
    expect(typeof entry.year).toBe("number");
    expect(typeof entry.deposits).toBe("number");
    expect(typeof entry.rewards).toBe("number");
  });
});
