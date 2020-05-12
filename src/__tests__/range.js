// @flow
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
    for (let k in bn) {
      // $FlowFixMe
      obj[k] = asString(bn[k]);
    }
    return obj;
  }
  return bn;
}

test("inferDynamicRange", () => {
  expect(asString(inferDynamicRange(BigNumber(0.4)))).toMatchSnapshot();
  expect(asString(inferDynamicRange(BigNumber(1)))).toMatchSnapshot();
  expect(asString(inferDynamicRange(BigNumber(1.01)))).toMatchSnapshot();
  expect(asString(inferDynamicRange(BigNumber(10)))).toMatchSnapshot();
  expect(asString(inferDynamicRange(BigNumber(100)))).toMatchSnapshot();
  expect(asString(inferDynamicRange(BigNumber(99)))).toMatchSnapshot();
});

test("projectRangeIndex", () => {
  expect(
    asString(projectRangeIndex(inferDynamicRange(BigNumber(0.4)), 2))
  ).toMatchSnapshot();
});

test("reverseRangeIndex", () => {
  const range = inferDynamicRange(BigNumber(0.4));
  for (let i = 0; i < range.steps; i++) {
    const n = projectRangeIndex(range, i);
    expect(reverseRangeIndex(range, n)).toBe(i);
  }
});
