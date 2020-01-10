// @flow
import {
  formatSize
} from "./formatting";

test("Scenario: Formatting - format bytes", () => {
  const defaultSize = "default";
  const bytes = [
    [1024 * 10],
    [0],
    [undefined, defaultSize]
  ];
  const formattedBytes = bytes.map((args) => formatSize(...args));
  const expectedSizes = ["10Kb", "", defaultSize];
  expect(formattedBytes).toEqual(expectedSizes);
});
