import type { CantonCoinConfig } from "../../config";
import { createMockCoinConfigValue, createMockContext } from "../../test/fixtures";
import { estimateFees, estimateSendMax } from "../estimateFees";

const magnitude: bigint = 10n ** 38n;
const createMockConfigWithFee = (fee: number | undefined): CantonCoinConfig => {
  const base = createMockCoinConfigValue();
  if (fee !== undefined) {
    return { ...base, fee };
  }
  return base;
};

describe("estimateFees", () => {
  it("returns 2 CC fees for 100 CC", async () => {
    const context = createMockContext(createMockConfigWithFee(undefined));

    const result = await estimateFees(context, 100n * magnitude);

    // 2 CC
    expect(result).toEqual(2n * magnitude);
  });

  it("returns 11 CC fees for 1000 CC", async () => {
    const context = createMockContext(createMockConfigWithFee(undefined));

    const result = await estimateFees(context, 1000n * magnitude);

    // 11 CC
    expect(result).toEqual(11n * magnitude);
  });

  it("returns forced fees when setup in config", async () => {
    const context = createMockContext(createMockConfigWithFee(3));

    const result = await estimateFees(context, 1000n * magnitude);

    // 3 CC
    expect(result).toEqual(3n * magnitude);
  });

  it("returns forced fees when 0 is setup in config", async () => {
    const context = createMockContext(createMockConfigWithFee(0));

    const result = await estimateFees(context, 1000n * magnitude);

    expect(result).toEqual(0n);
  });

  it("keeps charging 0.001% above the last tier limit of 100,000,000 CC", async () => {
    const context = createMockContext(createMockConfigWithFee(undefined));
    const lastLimit = 100_000_000n * magnitude;
    const feeAtLastLimit = 10_181n * magnitude;

    expect(await estimateFees(context, lastLimit)).toEqual(feeAtLastLimit);
    expect(await estimateFees(context, lastLimit + 99_999n)).toEqual(feeAtLastLimit);
    expect(await estimateFees(context, lastLimit + 100_000n)).toEqual(feeAtLastLimit + 1n);
    expect(await estimateFees(context, 2n * lastLimit)).toEqual(11_181n * magnitude);
  });
});

describe("estimateSendMax", () => {
  describe("with a forced fee", () => {
    const context = createMockContext(createMockConfigWithFee(3));

    it("returns the balance minus the fee", async () => {
      expect(await estimateSendMax(context, 10n * magnitude)).toEqual({
        amount: 7n * magnitude,
        fee: 3n * magnitude,
      });
    });

    it("returns nothing when the fee is above the balance", async () => {
      expect(await estimateSendMax(context, 2n * magnitude)).toEqual({
        amount: 0n,
        fee: 3n * magnitude,
      });
    });
  });

  describe("with the tiered fee", () => {
    const context = createMockContext(createMockConfigWithFee(undefined));
    const costOf = async (amount: bigint) => amount + (await estimateFees(context, amount));

    it.each([
      ["1.01 CC", (101n * magnitude) / 100n],
      ["9 CC", 9n * magnitude],
      ["100 CC", 100n * magnitude],
      ["10,000 CC and its fee less one unit", 10_101n * magnitude - 1n],
      ["200,000,000 CC", 200_000_000n * magnitude],
    ])("returns the largest amount that fits in %s, with its fee", async (_, balance) => {
      const { amount, fee } = await estimateSendMax(context, balance);

      expect(amount).toBeGreaterThan(0n);
      expect(fee).toEqual(await estimateFees(context, amount));
      expect(await costOf(amount)).toBeLessThanOrEqual(balance);
      expect(await costOf(amount + 1n)).toBeGreaterThan(balance);
    });

    it.each([
      ["10,000 CC", 10_000n * magnitude, 101n * magnitude],
      ["100,000 CC", 100_000n * magnitude, 191n * magnitude],
      ["100,000,000 CC", 100_000_000n * magnitude, 10_181n * magnitude],
    ])("returns the tier limit of %s from that limit plus its fee", async (_, limit, fee) => {
      expect(await estimateSendMax(context, limit + fee)).toEqual({ amount: limit, fee });
    });

    it("leaves the dust that rounding cannot avoid", async () => {
      expect(await estimateSendMax(context, magnitude + 100n)).toEqual({
        amount: 99n,
        fee: magnitude,
      });
    });

    it.each([
      ["1 CC", magnitude],
      ["0.5 CC", magnitude / 2n],
    ])("returns nothing at %s, below the cost of any send", async (_, balance) => {
      expect(await estimateSendMax(context, balance)).toEqual({ amount: 0n, fee: magnitude });
    });
  });
});
