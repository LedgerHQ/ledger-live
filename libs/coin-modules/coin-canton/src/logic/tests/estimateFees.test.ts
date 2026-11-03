import type { CantonCoinConfig } from "../../config";
import { createMockCoinConfigValue, createMockContext } from "../../test/fixtures";
import { estimateFees } from "../estimateFees";

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
});
