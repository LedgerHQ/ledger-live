import { computeEarnUiVersion } from "./computeEarnUiVersion";

describe("computeEarnUiVersion", () => {
  it.each([
    [{ baseUiVersion: "v1", shouldDisplayEarnUpselling: true }, "v3"],
    [{ baseUiVersion: "v2", shouldDisplayEarnSimulator: true }, "v4"],
    [
      { baseUiVersion: "v2", shouldDisplayEarnUpselling: true, shouldDisplayEarnSimulator: true },
      "v4",
    ],
  ])("applies feature precedence for %p => %s", (input, expected) => {
    expect(computeEarnUiVersion(input)).toBe(expected);
  });

  it.each([
    [{ baseUiVersion: "v2" }, "v2"],
    [{ baseUiVersion: "2" }, "v2"],
    [{ baseUiVersion: 3 }, "v3"],
    [{ baseUiVersion: null }, "v2"],
    [{ baseUiVersion: undefined }, "v2"],
    [{ baseUiVersion: "garbage" }, "v2"],
  ])("normalizes baseUiVersion for %p => %s", (input, expected) => {
    expect(computeEarnUiVersion(input)).toBe(expected);
  });
});
