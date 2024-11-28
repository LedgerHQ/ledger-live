import expect from "expect";
import { calcComputeMass, calcStorageMass } from "../massCalcluation";
import { BigNumber } from "bignumber.js";

describe("Check storage mass calculation", () => {
  test("Storage mass for different in- and outputs", () => {
    const mass: number = calcStorageMass([BigNumber(1_0000_0000)], [BigNumber(2000_0000)]);

    expect(
      calcStorageMass([BigNumber(1_0000_0000), BigNumber(1_0000_0000)], [BigNumber(9000_0000)]),
    ).toBe(0);
    expect(
      calcStorageMass(
        [BigNumber(1_0000_0000), BigNumber(1_0000_0000)],
        [BigNumber(9000_0000), BigNumber(1000)],
      ),
    ).toBe(999991111);
    expect(
      calcStorageMass(
        [BigNumber(1_1000_0000)],
        [BigNumber(9000_0000), BigNumber(1000), BigNumber(1000), BigNumber(1000)],
      ),
    ).toBe(3000002021);
    expect(
      calcStorageMass([BigNumber(1_0000_0000)], [BigNumber(7900_0000), BigNumber(2000_0000)]),
    ).toBe(52658);
  });

  describe("Check compute mass calculation", () => {
    test("Storage mass for 1 input", () => {
      expect(calcComputeMass(2, true)).toBe(918 + 2 * 1118);
      expect(calcComputeMass(5, true)).toBe(918 + 5 * 1118);
      expect(calcComputeMass(2, false)).toBe(506 + 2 * 1118);
      expect(calcComputeMass(5, false)).toBe(506 + 5 * 1118);
      expect(calcComputeMass(5, false, true)).toBe(506 + 5 * 1118 + 11);
    });
  });
});
