import { eligibilityOptionOf, selectEligibilityOption } from "./eligibility";

describe("eligibility options", () => {
  it.each([
    [true, "eligible"],
    [false, "notEligible"],
    [null, "unrecorded"],
  ] as const)("maps the eligibility %s to the option %s and back", (isEligible, option) => {
    const onEligibilityChange = jest.fn();

    expect(eligibilityOptionOf(isEligible)).toBe(option);
    selectEligibilityOption(option, onEligibilityChange);

    expect(onEligibilityChange).toHaveBeenCalledWith(isEligible);
  });

  it("ignores a value that is not an eligibility option", () => {
    const onEligibilityChange = jest.fn();

    selectEligibilityOption("unknown", onEligibilityChange);

    expect(onEligibilityChange).not.toHaveBeenCalled();
  });
});
