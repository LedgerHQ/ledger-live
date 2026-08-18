import { mapDecisionToQaExpectation } from "./verdict";
import type { AnalyticsConsentDecision } from "../types";

describe("mapDecisionToQaExpectation", () => {
  const renewal: AnalyticsConsentDecision = { kind: "renewal", reason: "major_bump" };
  const privacy: AnalyticsConsentDecision = { kind: "privacy", reason: "minor_bump" };
  const none: AnalyticsConsentDecision = { kind: "none", reason: "up_to_date" };

  it("returns Quiet when blocked", () => {
    expect(mapDecisionToQaExpectation(renewal, false, "analyticsOptIn flag is off")).toBe("Quiet");
  });

  it("maps renewal to Re-ask", () => {
    expect(mapDecisionToQaExpectation(renewal, true)).toBe("Re-ask");
    expect(mapDecisionToQaExpectation(renewal, false)).toBe("Re-ask");
  });

  it("maps privacy to Ack only", () => {
    expect(mapDecisionToQaExpectation(privacy, true)).toBe("Ack only");
  });

  it("maps none to Quiet", () => {
    expect(mapDecisionToQaExpectation(none, true)).toBe("Quiet");
  });
});
