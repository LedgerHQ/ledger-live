import BigNumber from "bignumber.js";

export type BNLike = BigNumber | number | string;

export function toBN(v: BNLike): BigNumber {
  return BigNumber.isBigNumber(v) ? v : new BigNumber(v);
}

/**
 * Lightweight BigNumber-aware assertions. Avoids `.toString()` boilerplate
 * everywhere and surfaces a readable diff on failure.
 */
export function expectBN(actual: BNLike): {
  toEqualBN: (expected: BNLike) => void;
  toBeCloseToBN: (expected: BNLike, decimals?: number) => void;
  toBePositive: () => void;
} {
  const a = toBN(actual);
  return {
    toEqualBN(expected: BNLike): void {
      const e = toBN(expected);
      if (!a.isEqualTo(e)) {
        throw new Error(`Expected BigNumber ${a.toString()} to equal ${e.toString()}`);
      }
    },
    toBeCloseToBN(expected: BNLike, decimals = 2): void {
      const e = toBN(expected);
      const tolerance = new BigNumber(10).pow(-decimals);
      const diff = a.minus(e).absoluteValue();
      if (diff.gt(tolerance)) {
        throw new Error(
          `Expected BigNumber ${a.toString()} to be within ${tolerance.toString()} of ${e.toString()} (diff ${diff.toString()})`,
        );
      }
    },
    toBePositive(): void {
      if (!a.isPositive() || a.isZero()) {
        throw new Error(`Expected BigNumber ${a.toString()} to be strictly positive`);
      }
    },
  };
}
