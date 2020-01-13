// @flow
import { formatSize } from "./formatting";

test("Scenario: Formatting - format bytes", () => {
  const bytes = [[4096], [1], [1025], [4097, 4096], [undefined], [0]];
  const formattedBytes = bytes.map(args => formatSize(...args));
  const expectedSizes = ["4Kb", "1Kb", "2Kb", "8Kb", "", ""];
  expect(formattedBytes).toEqual(expectedSizes);
});
