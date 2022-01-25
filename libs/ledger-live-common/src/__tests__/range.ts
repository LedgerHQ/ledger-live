import { BigNumber } from "bignumber.js";
import {
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
