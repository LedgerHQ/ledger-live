import { formatSize } from "./formatting";
test("Scenario: Formatting - format bytes", () => {
  const bytes: [number | undefined, number][] = [
    [4096, 4096],
    [1, 4096],
    [1025, 1024],
    [4097, 4096],
    [undefined, 4096],
    [0, 4096],
  ];
  const formattedBytes = bytes.map((args) => formatSize(args[0], args[1]));
  const expectedSizes = ["4Kb", "4Kb", "2Kb", "8Kb", "", ""];
  expect(formattedBytes).toEqual(expectedSizes);
});
