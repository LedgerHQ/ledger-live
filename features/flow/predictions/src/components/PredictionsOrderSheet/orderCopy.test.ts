import { displayedShares, outcomeTagAppearance } from "./orderCopy";

describe("outcomeTagAppearance", () => {
  it.each([
    ["yes", "success"],
    ["no", "error"],
    [undefined, "gray"],
  ] as const)(
    "tags a %p outcome %s, like the live app's side switch",
    (outcomeSide, appearance) => {
      expect(
        outcomeTagAppearance({ marketTitle: "Fed decision", outcomeLabel: "Yes", outcomeSide }),
      ).toBe(appearance);
    },
  );
});

describe("displayedShares", () => {
  it.each([
    [16.129, 16.13],
    [1.004, 1],
    [1.005, 1.01],
    [12_345.678, 12_345.68],
    [3.7, 3.7],
  ])("rounds %p shares to %p, as shown", (shares, displayed) => {
    expect(displayedShares(shares)).toBe(displayed);
  });
});
