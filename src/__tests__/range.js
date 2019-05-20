// @flow
import {
  inferDynamicRange,
  projectRangeIndex,
  reverseRangeIndex
} from "../range";

test("inferDynamicRange", () => {
  expect(inferDynamicRange(0.4)).toMatchSnapshot();
  expect(inferDynamicRange(1)).toMatchSnapshot();
  expect(inferDynamicRange(1.01)).toMatchSnapshot();
  expect(inferDynamicRange(10)).toMatchSnapshot();
  expect(inferDynamicRange(100)).toMatchSnapshot();
  expect(inferDynamicRange(99)).toMatchSnapshot();
});

test("projectRangeIndex", () => {
  expect(projectRangeIndex(inferDynamicRange(0.4), 2)).toMatchSnapshot();
});

test("reverseRangeIndex", () => {
  const range = inferDynamicRange(0.4);
  for (let i = 0; i < range.steps; i++) {
    const n = projectRangeIndex(range, i);
    expect(reverseRangeIndex(range, n)).toBe(i);
  }
});
