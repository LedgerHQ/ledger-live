import { randomAmount, seededRandom } from "./random";

const draw = (seed: string) => Array.from({ length: 5 }, seededRandom(seed));

describe("seededRandom", () => {
  it("draws the same sequence for the same seed, another for another seed", () => {
    expect(draw("a")).toEqual(draw("a"));
    expect(draw("a")).not.toEqual(draw("b"));
    expect(draw("a").every(value => value >= 0 && value < 1)).toBe(true);
  });
});

describe("randomAmount", () => {
  it("stays within the bounds, in the smallest unit", () => {
    const random = seededRandom("amount");
    for (let i = 0; i < 100; i++) {
      const amount = randomAmount(random, 8, 0.0005, 2);
      expect(amount).toBeGreaterThanOrEqual(50_000n);
      expect(amount).toBeLessThanOrEqual(200_000_000n);
    }
  });
});
