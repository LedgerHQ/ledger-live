import {
  APPROVED_STATES,
  evaluateLocalEligibility,
  isApprovedState,
  parseRequiredStates,
  type EligibilityContext,
} from ".";

const allMet: EligibilityContext = { hasFunds: true, isOnboarded: true, hasStax: true };
const noneMet: EligibilityContext = { hasFunds: false, isOnboarded: false, hasStax: false };

const card = (requiredStates?: string, extras: Record<string, string> = {}) => ({
  extras: requiredStates === undefined ? extras : { ...extras, requiredStates },
});

describe("parseRequiredStates", () => {
  it("splits a semicolon-separated list", () => {
    expect(parseRequiredStates("hasFunds;isOnboarded;hasStax")).toEqual([
      "hasFunds",
      "isOnboarded",
      "hasStax",
    ]);
  });

  it("trims whitespace and drops empty segments", () => {
    expect(parseRequiredStates(" hasFunds ; ;isOnboarded; ")).toEqual(["hasFunds", "isOnboarded"]);
  });

  it("returns an empty list for missing or blank input", () => {
    expect(parseRequiredStates(undefined)).toEqual([]);
    expect(parseRequiredStates("")).toEqual([]);
    expect(parseRequiredStates("   ")).toEqual([]);
  });
});

describe("isApprovedState", () => {
  it.each(APPROVED_STATES)("accepts the approved state %s", state => {
    expect(isApprovedState(state)).toBe(true);
  });

  it("rejects unknown or misspelled states", () => {
    expect(isApprovedState("hasFund")).toBe(false);
    expect(isApprovedState("HASFUNDS")).toBe(false);
    expect(isApprovedState("")).toBe(false);
  });
});

describe("evaluateLocalEligibility", () => {
  it("is eligible when there are no required states", () => {
    expect(evaluateLocalEligibility(card(undefined), noneMet)).toEqual({ eligible: true });
    expect(evaluateLocalEligibility(card(""), noneMet)).toEqual({ eligible: true });
    expect(evaluateLocalEligibility({}, noneMet)).toEqual({ eligible: true });
  });

  it("is eligible when every required state is met", () => {
    expect(evaluateLocalEligibility(card("hasFunds;isOnboarded;hasStax"), allMet)).toEqual({
      eligible: true,
    });
  });

  it("blocks on the first unmet approved state", () => {
    expect(
      evaluateLocalEligibility(card("hasFunds;isOnboarded"), { ...allMet, isOnboarded: false }),
    ).toEqual({ eligible: false, blockedBy: "isOnboarded", reason: "unmet-state" });
  });

  it("blocks unknown states as a fail-safe with a debug signal", () => {
    expect(evaluateLocalEligibility(card("hasFunds;hasTypo"), allMet)).toEqual({
      eligible: false,
      blockedBy: "hasTypo",
      reason: "unknown-state",
    });
  });

  it("reports the first failing state in declaration order", () => {
    // hasStax is unmet before the unknown state is reached.
    expect(
      evaluateLocalEligibility(card("hasStax;unknownState"), { ...allMet, hasStax: false }),
    ).toEqual({ eligible: false, blockedBy: "hasStax", reason: "unmet-state" });
  });

  it("treats a state absent from the context as unmet", () => {
    const partialContext: EligibilityContext = { hasFunds: true };
    expect(evaluateLocalEligibility(card("isOnboarded"), partialContext)).toEqual({
      eligible: false,
      blockedBy: "isOnboarded",
      reason: "unmet-state",
    });
  });
});
