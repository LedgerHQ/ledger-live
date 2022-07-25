import { BigNumber } from "bignumber.js";
import {
  fromRangeRaw,
  toRangeRaw,
  inferDynamicRange,
  projectRangeIndex,
  reverseRangeIndex,
} from "../range";

function asString(bn) {
  if (BigNumber.isBigNumber(bn)) return bn.toString();

  if (typeof bn === "object" && bn) {
    const obj = {};

    for (const k in bn) {
      obj[k] = asString(bn[k]);
    }

    return obj;
  }

  return bn;
}

test("inferDynamicRange", () => {
  expect(asString(inferDynamicRange(new BigNumber(0.4)))).toMatchSnapshot();
  expect(asString(inferDynamicRange(new BigNumber(1)))).toMatchSnapshot();
  expect(asString(inferDynamicRange(new BigNumber(1.01)))).toMatchSnapshot();
  expect(asString(inferDynamicRange(new BigNumber(10)))).toMatchSnapshot();
  expect(asString(inferDynamicRange(new BigNumber(100)))).toMatchSnapshot();
  expect(asString(inferDynamicRange(new BigNumber(99)))).toMatchSnapshot();
});

test("projectRangeIndex", () => {
  expect(
    asString(projectRangeIndex(inferDynamicRange(new BigNumber(0.4)), 2))
  ).toMatchSnapshot();
});

test("reverseRangeIndex", () => {
  const range = inferDynamicRange(new BigNumber(0.4));

  for (let i = 0; i < range.steps; i++) {
    const n = projectRangeIndex(range, i);
    expect(reverseRangeIndex(range, n)).toBe(i);
  }
});

describe("RangeRaw", () => {
  [0.4, 1, 10, 111, 666, 99999].forEach((v) => {
    test("fromRangeRaw(toRangeRaw(x)) is identity for inferred " + v, () => {
      const range = inferDynamicRange(new BigNumber(v));
      expect(fromRangeRaw(toRangeRaw(range))).toEqual(range);
    });
  });
});
