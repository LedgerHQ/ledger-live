import { resolveAnalyticsConsentPhase } from "./resolveAnalyticsConsentPhase";
import type { AnalyticsConsentDecision } from "../types";

const renewal: AnalyticsConsentDecision = { kind: "renewal", reason: "major_bump" };
const privacy: AnalyticsConsentDecision = { kind: "privacy", reason: "minor_bump" };
const none: AnalyticsConsentDecision = { kind: "none", reason: "up_to_date" };

describe("resolveAnalyticsConsentPhase", () => {
  it("asks a user who shares analytics to reconfirm", () => {
    expect(resolveAnalyticsConsentPhase("closed", renewal, true)).toBe("consentReconfirm");
  });

  it("asks a user who does not share analytics for a fresh choice", () => {
    expect(resolveAnalyticsConsentPhase("closed", renewal, false)).toBe("consentFresh");
  });

  it("shows the privacy sheet on a minor bump", () => {
    expect(resolveAnalyticsConsentPhase("closed", privacy, true)).toBe("privacy");
  });

  it("stays closed when nothing is required", () => {
    expect(resolveAnalyticsConsentPhase("closed", none, true)).toBe("closed");
  });

  it("keeps the phase the user is already in", () => {
    expect(resolveAnalyticsConsentPhase("privacy", renewal, false)).toBe("privacy");
  });
});
